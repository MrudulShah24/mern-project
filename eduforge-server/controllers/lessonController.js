const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

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

    // Calculate overall course progress
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = enrollment.progress.reduce((acc, m) => {
      return acc + m.lessons.filter(l => l.completed).length;
    }, 0);
    
    enrollment.progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Save the enrollment with updated progress
    await enrollment.save();

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

    // Calculate overall course progress
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = enrollment.progress.reduce((acc, m) => {
      return acc + m.lessons.filter(l => l.completed).length;
    }, 0);
    
    enrollment.progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Save the enrollment with updated progress
    await enrollment.save();

    // Update Course model progress too
    const courseRecord = await Course.findById(courseId);
    const studentRecord = courseRecord.enrolledStudents.find(
      s => s.student.toString() === userId.toString()
    );
    
    if (studentRecord) {
      // Update progress in Course model
      studentRecord.progressPercentage = enrollment.progressPercentage;
      await courseRecord.save();
    }

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

    // Calculate overall course progress
    const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
    const completedLessonsCount = enrollment.progress.reduce((acc, m) => {
      return acc + (m.lessons ? m.lessons.filter(l => l.completed).length : 0);
    }, 0);
    
    enrollment.progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    await enrollment.save();

    // Update Course model student record progress
    const studentRecord = course.enrolledStudents.find(
      s => s.student.toString() === userId.toString()
    );
    
    if (studentRecord) {
      studentRecord.progressPercentage = enrollment.progressPercentage;
      await course.save();
    }

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

    // Run the test cases against the submitted code
    // This would typically involve a code execution service
    // For demonstration, we'll use a simple check against expected output
    let passed = false;
    let output = '';
    
    try {
      // Simulated code evaluation - this would be replaced with actual code execution
      // In a real implementation, this would call a secure code execution service
      
      // For demonstration, check if the code contains expected solution patterns
      const expectedPatterns = lesson.codeExercise.expectedPatterns || [];
      const avoidPatterns = lesson.codeExercise.avoidPatterns || [];
      
      // Check if code includes all expected patterns
      const includesAllExpected = expectedPatterns.every(pattern => 
        code.includes(pattern)
      );
      
      // Check if code avoids all patterns to avoid
      const avoidsAllBadPatterns = avoidPatterns.every(pattern => 
        !code.includes(pattern)
      );
      
      passed = includesAllExpected && avoidsAllBadPatterns;
      
      output = passed 
        ? 'All tests passed successfully!' 
        : 'Some tests failed. Please check your solution.';
        
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
      
      await enrollment.save();
      
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
    
    // This would typically call a secure code execution service
    // For demonstration purposes, we're simulating execution
    
    let output = '';
    
    switch(language.toLowerCase()) {
      case 'javascript':
        output = 'JavaScript code executed successfully!\nConsole output would appear here.';
        break;
      case 'python':
        output = 'Python code executed successfully!\n>>> Output would appear here.';
        break;
      case 'java':
        output = 'Java code compiled and executed successfully!\nOutput would appear here.';
        break;
      default:
        output = `${language} code executed successfully!\nOutput would appear here.`;
    }
    
    res.json({ output });
  } catch (err) {
    console.error('Error running code:', err);
    res.status(500).json({ error: 'Failed to run code: ' + err.message });
  }
};

module.exports = exports;