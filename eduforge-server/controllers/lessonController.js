const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const codeExecutor = require('../utils/codeExecutor');


// Centralized progress synchronization helper
const syncProgressAndSave = async (enrollment, courseId, userId) => {
  const course = await Course.findById(courseId);
  if (course) {
    const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
    
    // Sync completedLessons flat array from progress subdocuments
    const completedLessonIds = [];
    enrollment.progress.forEach(moduleProg => {
      if (moduleProg.lessons) {
        moduleProg.lessons.forEach(lessonProg => {
          if (lessonProg.completed) {
            completedLessonIds.push(lessonProg.lessonId.toString());
          }
        });
      }
    });

    enrollment.completedLessons = completedLessonIds;
    
    // Update progressPercentage on enrollment
    const completedCount = completedLessonIds.length;
    enrollment.progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Sync back to Course model enrolledStudents progressPercentage
    if (!course.enrolledStudents) {
      course.enrolledStudents = [];
    }

    let studentRecord = course.enrolledStudents.find(
      s => s.student && s.student.toString() === userId.toString()
    );

    if (!studentRecord) {
      studentRecord = {
        student: userId,
        enrolledAt: enrollment.createdAt || new Date(),
        progressPercentage: enrollment.progressPercentage,
        progress: []
      };
      course.enrolledStudents.push(studentRecord);
    }

    studentRecord.progressPercentage = enrollment.progressPercentage;
    
    // Keep course-level student module completion list in sync
    studentRecord.progress = course.modules.map((mod, idx) => {
      const modProg = enrollment.progress.find(p => p.moduleId.toString() === mod._id.toString());
      return {
        moduleId: idx,
        completed: modProg ? modProg.completed : false,
        completedAt: modProg ? modProg.completedAt : undefined
      };
    });
    
    await course.save();
  }

  // Force deep serialization updates on nested arrays
  enrollment.markModified('progress');
  enrollment.markModified('completedLessons');
  await enrollment.save();
};

// Get lesson content with progress
exports.getLessonContent = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;

    // Check if the user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find the course and extract lesson content
    const course = await Course.findById(courseId)
      .select('modules');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the module
    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Find the lesson
    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Get user progress for this lesson
    let lessonProgress = null;
    const moduleProgress = enrollment.progress.find(p => p.moduleId.toString() === moduleId.toString());
    
    if (moduleProgress && Array.isArray(moduleProgress.lessons)) {
      lessonProgress = moduleProgress.lessons.find(l => l.lessonId.toString() === lessonId.toString());
    }

    // Return lesson with progress
    res.json({
      ...lesson.toObject(),
      progress: lessonProgress || {
        completed: false,
        videoCompleted: false,
        quizCompleted: false,
        exerciseCompleted: false,
        quizScore: 0
      }
    });
  } catch (err) {
    console.error('Error getting lesson content:', err);
    res.status(500).json({ error: 'Failed to retrieve lesson content' });
  }
};

// Update lesson progress
exports.updateLessonProgress = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;
    const { 
      videoCompleted, 
      quizCompleted, 
      exerciseCompleted, 
      quizScore
    } = req.body;

    // Check if the user is enrolled in the course
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find or initialize module progress
    let moduleProgress = enrollment.progress.find(p => 
      p.moduleId.toString() === moduleId.toString()
    );
    
    if (!moduleProgress) {
      // Initialize module progress
      enrollment.progress.push({
        moduleId,
        completed: false,
        lessons: []
      });
      moduleProgress = enrollment.progress[enrollment.progress.length - 1];
    }

    if (!moduleProgress.lessons) {
      moduleProgress.lessons = [];
    }

    // Find or initialize lesson progress
    let lessonProgress = moduleProgress.lessons.find(l => 
      l.lessonId.toString() === lessonId.toString()
    );
    
    if (!lessonProgress) {
      // Initialize lesson progress
      moduleProgress.lessons.push({
        lessonId,
        completed: false,
        videoCompleted: false,
        quizCompleted: false,
        exerciseCompleted: false,
        quizScore: 0
      });
      lessonProgress = moduleProgress.lessons[moduleProgress.lessons.length - 1];
    }

    // Update lesson progress
    if (videoCompleted !== undefined) {
      lessonProgress.videoCompleted = videoCompleted;
    }
    
    if (quizCompleted !== undefined) {
      lessonProgress.quizCompleted = quizCompleted;
    }
    
    if (exerciseCompleted !== undefined) {
      lessonProgress.exerciseCompleted = exerciseCompleted;
    }
    
    if (quizScore !== undefined) {
      lessonProgress.quizScore = quizScore;
    }

    // Check if all components of the lesson are completed
    const course = await Course.findById(courseId)
      .select('modules');
    
    const module = course.modules.id(moduleId);
    const lesson = module.lessons.id(lessonId);
    
    const hasVideo = !!lesson.videoUrl;
    const hasQuiz = !!(lesson.quiz && lesson.quiz.questions.length > 0);
    const hasExercise = !!lesson.codeExercise;
    
    const videoComplete = !hasVideo || lessonProgress.videoCompleted;
    const quizComplete = !hasQuiz || lessonProgress.quizCompleted;
    const exerciseComplete = !hasExercise || lessonProgress.exerciseCompleted;
    
    // Mark lesson as completed if all components are done
    if (videoComplete && quizComplete && exerciseComplete) {
      lessonProgress.completed = true;
      lessonProgress.completedAt = new Date();
    }

    // Check if all lessons in the module are completed
    const allLessonsCompleted = module.lessons.every(l => {
      const progress = moduleProgress.lessons.find(pl => 
        pl.lessonId.toString() === l._id.toString()
      );
      return progress && progress.completed;
    });
    
    // Mark module as completed if all lessons are done
    if (allLessonsCompleted) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();
    }

    // Re-calculate, sync legacy fields, sync course student record, and save enrollment
    await syncProgressAndSave(enrollment, courseId, userId);

    res.json({ 
      message: 'Progress updated successfully',
      progress: lessonProgress
    });
  } catch (err) {
    console.error('Error updating lesson progress:', err);
    res.status(500).json({ error: 'Failed to update lesson progress' });
  }
};

// Mark a lesson as fully completed
exports.markLessonComplete = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;

    // Check if the user is enrolled in the course
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find or initialize module progress
    let moduleProgress = enrollment.progress.find(p => 
      p.moduleId.toString() === moduleId.toString()
    );
    
    if (!moduleProgress) {
      // Initialize module progress
      enrollment.progress.push({
        moduleId,
        completed: false,
        lessons: []
      });
      moduleProgress = enrollment.progress[enrollment.progress.length - 1];
    }

    if (!moduleProgress.lessons) {
      moduleProgress.lessons = [];
    }

    // Find or initialize lesson progress
    let lessonProgress = moduleProgress.lessons.find(l => 
      l.lessonId.toString() === lessonId.toString()
    );
    
    if (!lessonProgress) {
      // Initialize lesson progress
      moduleProgress.lessons.push({
        lessonId,
        completed: false,
        videoCompleted: false,
        quizCompleted: false,
        exerciseCompleted: false,
        quizScore: 0
      });
      lessonProgress = moduleProgress.lessons[moduleProgress.lessons.length - 1];
    }

    // Mark everything as completed
    lessonProgress.videoCompleted = true;
    lessonProgress.quizCompleted = true;
    lessonProgress.exerciseCompleted = true;
    lessonProgress.completed = true;
    lessonProgress.completedAt = new Date();

    // Update completedLessons array for legacy support
    if (!enrollment.completedLessons) {
      enrollment.completedLessons = [];
    }
    
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Check if all lessons in the module are completed
    const course = await Course.findById(courseId)
      .select('modules');
    
    const module = course.modules.id(moduleId);
    
    const allLessonsCompleted = module.lessons.every(l => {
      const progress = moduleProgress.lessons.find(pl => 
        pl.lessonId.toString() === l._id.toString()
      );
      return progress && progress.completed;
    });
    
    // Mark module as completed if all lessons are done
    if (allLessonsCompleted) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();
    }

    // Re-calculate, sync legacy fields, sync course student record, and save enrollment
    await syncProgressAndSave(enrollment, courseId, userId);

    res.json({ 
      message: 'Lesson marked as complete',
      progress: lessonProgress,
      completedLessons: enrollment.completedLessons
    });
  } catch (err) {
    console.error('Error marking lesson as complete:', err);
    res.status(500).json({ error: 'Failed to mark lesson as complete' });
  }
};

// Submit quiz for grading
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, moduleId, quizId } = req.params;
    const userId = req.user._id;
    const { answers } = req.body;

    console.log('Quiz submission params:', { courseId, moduleId, quizId });
    console.log('Quiz answers:', answers);

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: 'Invalid Quiz ID format' });
    }

    // Check if the user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find the course and the quiz
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the module and quiz
    let quiz = null;
    let module = null;
    let lessonId = null;

    // Check if it's a module quiz or lesson quiz
    for (const mod of course.modules) {
      if (mod._id.toString() === moduleId) {
        module = mod;
        
        // Check if it's a module-level quiz
        if (mod.quiz && mod.quiz._id.toString() === quizId) {
          quiz = mod.quiz;
          break;
        }
        
        // Check if it's a lesson-level quiz
        for (const lesson of mod.lessons) {
          if (lesson.quiz && lesson.quiz._id.toString() === quizId) {
            quiz = lesson.quiz;
            lessonId = lesson._id;
            break;
          }
        }
        break;
      }
    }

    // Fallback approach: use the first quiz found if ID doesn't match
    if (!quiz && module) {
      console.log('No exact ID match, trying fallback...');
      for (const lesson of module.lessons) {
        if (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0) {
          quiz = lesson.quiz;
          lessonId = lesson._id;
          break;
        }
      }
      if (!quiz && module.quiz && module.quiz.questions && module.quiz.questions.length > 0) {
        quiz = module.quiz;
      }
    }

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade the quiz
    let correctCount = 0;
    const results = [];
    const correctAnswers = {};
    const explanations = {};
    
    quiz.questions.forEach((question) => {
      const questionId = question._id.toString();
      const correctOption = question.options.find(o => o.isCorrect);
      
      if (correctOption) {
        correctAnswers[questionId] = correctOption._id.toString();
      }
      explanations[questionId] = question.explanation || '';
      
      const selectedAnswerId = answers[questionId];
      const isCorrect = selectedAnswerId === correctAnswers[questionId];
      
      if (isCorrect) {
        correctCount++;
      }
      
      results.push({
        questionId,
        selectedAnswerId,
        correctAnswerId: correctAnswers[questionId],
        isCorrect
      });
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 70);

    // Update user progress in enrollment
    let moduleProgress = enrollment.progress.find(p => p.moduleId.toString() === moduleId);
    if (!moduleProgress) {
      enrollment.progress.push({
        moduleId,
        completed: false,
        lessons: []
      });
      moduleProgress = enrollment.progress[enrollment.progress.length - 1];
    }

    if (!moduleProgress.lessons) {
      moduleProgress.lessons = [];
    }

    if (lessonId) {
      // Quiz is part of a lesson
      let lessonProgress = moduleProgress.lessons.find(l => l.lessonId.toString() === lessonId.toString());
      if (!lessonProgress) {
        moduleProgress.lessons.push({
          lessonId,
          completed: false,
          videoCompleted: false,
          quizCompleted: passed,
          exerciseCompleted: false,
          quizScore: score
        });
        lessonProgress = moduleProgress.lessons[moduleProgress.lessons.length - 1];
      } else {
        lessonProgress.quizCompleted = passed;
        lessonProgress.quizScore = score;
      }

      // Check if the whole lesson is now complete
      const lesson = module.lessons.id(lessonId);
      const hasVideo = !!lesson.videoUrl;
      const hasExercise = !!lesson.codeExercise;
      
      const videoComplete = !hasVideo || lessonProgress.videoCompleted;
      const exerciseComplete = !hasExercise || lessonProgress.exerciseCompleted;
      
      if (videoComplete && passed && exerciseComplete) {
        lessonProgress.completed = true;
        lessonProgress.completedAt = new Date();
      }
    } else {
      // Quiz is part of a module
      moduleProgress.quizCompleted = passed;
      moduleProgress.quizScore = score;

      // For backward compatibility, also push to legacy quizResults
      enrollment.quizResults.push({
        moduleId,
        quizId,
        score,
        answers,
        passed,
        attemptedAt: new Date()
      });
    }

    // Check if the whole module is complete (all lessons and module quiz if exists)
    const allLessonsComplete = module.lessons.every(l => {
      const prog = moduleProgress.lessons.find(lp => lp.lessonId.toString() === l._id.toString());
      return prog && prog.completed;
    });

    const moduleQuizPassed = !module.quiz || (moduleProgress.quizCompleted);

    if (allLessonsComplete && moduleQuizPassed) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();
    }

    // Re-calculate, sync legacy fields, sync course student record, and save enrollment
    await syncProgressAndSave(enrollment, courseId, userId);

    res.json({
      score,
      passed,
      percentageScore: score,
      isPassing: passed,
      results,
      correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      userAnswers: answers,
      explanations,
      quizTitle: quiz.title,
      questions: quiz.questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options.map(o => ({
          id: o._id,
          text: o.text,
          isCorrect: o.isCorrect
        }))
      }))
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: 'Failed to submit quiz: ' + err.message });
  }
};

// Save user's code for an exercise
exports.saveCode = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;
    const { code } = req.body;

    // Check if the user is enrolled in the course
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find or initialize savedCode array
    if (!enrollment.savedCode) {
      enrollment.savedCode = [];
    }

    // Check if code already exists for this lesson
    const existingCodeIndex = enrollment.savedCode.findIndex(c => 
      c.moduleId.toString() === moduleId.toString() && 
      c.lessonId.toString() === lessonId.toString()
    );

    if (existingCodeIndex >= 0) {
      // Update existing code
      enrollment.savedCode[existingCodeIndex].code = code;
      enrollment.savedCode[existingCodeIndex].updatedAt = new Date();
    } else {
      // Add new code entry
      enrollment.savedCode.push({
        moduleId,
        lessonId,
        code,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await enrollment.save();

    res.json({ message: 'Code saved successfully' });
  } catch (err) {
    console.error('Error saving code:', err);
    res.status(500).json({ error: 'Failed to save code' });
  }
};

// Get user's saved code for an exercise
exports.getSavedCode = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;

    // Check if the user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find saved code for this lesson
    const savedCode = enrollment.savedCode?.find(c => 
      c.moduleId.toString() === moduleId.toString() && 
      c.lessonId.toString() === lessonId.toString()
    );

    if (!savedCode) {
      return res.json({ code: null });
    }

    res.json({ code: savedCode.code });
  } catch (err) {
    console.error('Error getting saved code:', err);
    res.status(500).json({ error: 'Failed to retrieve saved code' });
  }
};

// Submit code for exercise evaluation
exports.submitCode = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user._id;
    const { code } = req.body;

    // Check if the user is enrolled in the course
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Find the course, module and lesson
    const course = await Course.findById(courseId)
      .select('modules');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    if (!lesson.codeExercise) {
      return res.status(404).json({ error: 'No code exercise found for this lesson' });
    }

    // Run the test cases against the submitted code in the Secure Coding Sandbox
    let passed = false;
    let output = '';
    
    try {
      // Check expected patterns and avoid patterns first
      const expectedPatterns = lesson.codeExercise.expectedPatterns || [];
      const avoidPatterns = lesson.codeExercise.avoidPatterns || [];
      const language = lesson.codeExercise.language || 'javascript';
      
      // Clean comments to avoid false keyword matching in comments
      let cleanCode = code;
      if (language.toLowerCase() === 'javascript') {
        cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      } else if (language.toLowerCase() === 'python') {
        cleanCode = code.replace(/#.*/g, '');
      }
      
      // Check if it's the default dummy patterns array from the generator
      const isDefaultDummyPatterns = expectedPatterns.length === 3 && 
                                     expectedPatterns.includes('function') && 
                                     expectedPatterns.includes('return') && 
                                     expectedPatterns.includes('console.log');
      
      let includesAllExpected = true;
      if (expectedPatterns.length > 0) {
        if (isDefaultDummyPatterns && language.toLowerCase() !== 'javascript') {
          if (language.toLowerCase() === 'python') {
            // Check for python equivalent of function
            includesAllExpected = cleanCode.includes('def');
          } else {
            // For other languages (html, css, java, etc.), bypass the JS-specific checklist
            includesAllExpected = true;
          }
        } else {
          includesAllExpected = expectedPatterns.every(pattern => cleanCode.includes(pattern));
        }
      }
      
      const avoidsAllBadPatterns = avoidPatterns.every(pattern => 
        !cleanCode.includes(pattern)
      );
      
      if (!includesAllExpected) {
        passed = false;
        const displayPatterns = isDefaultDummyPatterns && language.toLowerCase() === 'python' ? ['def'] : expectedPatterns;
        output = `Code patterns check failed: Make sure you use the required keywords/expressions (e.g. ${displayPatterns.join(', ')}).`;
      } else if (!avoidsAllBadPatterns) {
        passed = false;
        const violated = avoidPatterns.filter(pattern => cleanCode.includes(pattern));
        output = `Code patterns check failed: Please remove restricted keywords/expressions (e.g. ${violated.join(', ')}).`;
      } else {
        
        // Baseline execution to check syntax/runtime errors
        const baseRun = await codeExecutor.execute(code, language);
        if (!baseRun.success) {
          passed = false;
          output = `Runtime/Syntax Error:\n${baseRun.error}`;
        } else {
          // Verify test cases
          const testCases = lesson.codeExercise.testCases || [];
          let failedTestCaseIndex = -1;
          let testCaseError = '';
          
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const isDummy = !tc.input || 
                            !tc.expectedOutput || 
                            tc.input.includes('test input') || 
                            tc.expectedOutput.includes('expected output');
            
            if (isDummy) {
              // Dummy test case is considered passed if baseline code executed without errors
              continue;
            }
            
            // Execute real test case
            let tcRun;
            if (language.toLowerCase() === 'javascript') {
              // Append input as expression to JS code to evaluate return value
              const testCode = `${code}\n;(${tc.input});`;
              tcRun = await codeExecutor.execute(testCode, language);
            } else {
              // Pass input as stdin for Python
              tcRun = await codeExecutor.execute(code, language, tc.input);
            }
            
            if (!tcRun.success) {
              failedTestCaseIndex = i;
              testCaseError = `Runtime error on test case ${i + 1}: ${tcRun.error}`;
              break;
            }
            
            const actualVal = tcRun.result !== undefined ? String(tcRun.result).trim() : tcRun.output.trim();
            const expectedVal = tc.expectedOutput.trim();
            
            // Allow matching of either the stdout print or the returned value
            const stdoutMatch = tcRun.output.trim() === expectedVal;
            const returnMatch = String(tcRun.result).trim() === expectedVal;
            const anyMatch = stdoutMatch || returnMatch;
            
            if (!anyMatch) {
              failedTestCaseIndex = i;
              if (tc.hidden) {
                testCaseError = `Failed a hidden test case.`;
              } else {
                let actualMsg = '';
                if (tcRun.output.trim()) {
                  actualMsg += `Stdout: "${tcRun.output.trim()}"`;
                }
                if (tcRun.result !== undefined) {
                  if (actualMsg) actualMsg += ', ';
                  actualMsg += `Returned: ${String(tcRun.result)}`;
                }
                testCaseError = `Failed test case ${i + 1}:\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}\nActual: ${actualMsg || 'No output/return value'}`;
              }
              break;
            }
          }
          
          if (failedTestCaseIndex === -1) {
            passed = true;
            output = `All tests passed successfully!\n\nConsole Output:\n${baseRun.output || '(No console output)'}`;
          } else {
            passed = false;
            output = testCaseError;
          }
        }
      }

        
      // Save the submission
      if (!enrollment.codeSubmissions) {
        enrollment.codeSubmissions = [];
      }
      
      enrollment.codeSubmissions.push({
        moduleId,
        lessonId,
        code,
        passed,
        submittedAt: new Date()
      });
      
      // Update progress if passed
      if (passed) {
        // Find or initialize module progress
        let moduleProgress = enrollment.progress.find(p => 
          p.moduleId.toString() === moduleId.toString()
        );
        
        if (!moduleProgress) {
          enrollment.progress.push({
            moduleId,
            completed: false,
            lessons: []
          });
          moduleProgress = enrollment.progress[enrollment.progress.length - 1];
        }
        
        if (!moduleProgress.lessons) {
          moduleProgress.lessons = [];
        }
        
        // Find or initialize lesson progress
        let lessonProgress = moduleProgress.lessons.find(l => 
          l.lessonId.toString() === lessonId.toString()
        );
        
        if (!lessonProgress) {
          moduleProgress.lessons.push({
            lessonId,
            completed: false,
            videoCompleted: false,
            quizCompleted: false,
            exerciseCompleted: true
          });
        } else {
          lessonProgress.exerciseCompleted = true;
        }
      }
      
      await syncProgressAndSave(enrollment, courseId, userId);
      
      res.json({
        passed,
        output
      });
    } catch (err) {
      console.error('Error evaluating code:', err);
      res.status(500).json({ 
        passed: false, 
        output: 'Error evaluating code: ' + err.message 
      });
    }
  } catch (err) {
    console.error('Error submitting code exercise:', err);
    res.status(500).json({ error: 'Failed to submit code exercise' });
  }
};



// Run code without submitting (for practice/testing)
exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const result = await codeExecutor.execute(code, language || 'javascript');
    
    if (result.success) {
      res.json({ 
        output: result.output || 'Code executed successfully with no console output.' 
      });
    } else {
      res.json({ 
        output: result.output ? `${result.output}\n\nError: ${result.error}` : `Error: ${result.error}` 
      });
    }
  } catch (err) {
    console.error('Error running code:', err);
    res.status(500).json({ error: 'Failed to run code: ' + err.message });
  }
};

module.exports = exports;