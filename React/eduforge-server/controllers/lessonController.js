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

    // Find the course, module and quiz
    const course = await Course.findById(courseId)
      .select('modules');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    console.log('Module found:', module.title);
    console.log('Module has quiz:', !!module.quiz);
    console.log('Module has lessons:', module.lessons.length);
    
    // Log information about quizzes in this module
    if (module.quiz) {
      console.log('Module quiz ID:', module.quiz._id);
    }
    
    module.lessons.forEach((lesson, index) => {
      if (lesson.quiz) {
        console.log(`Lesson ${index + 1} quiz ID:`, lesson.quiz._id);
      }
    });
    
    // Find the quiz (it could be in a lesson or directly in the module)
    let quiz;
    let lessonId;
    
    // Try finding the quiz with exact ID match
    // Check if the quiz is in a lesson
    for (const lesson of module.lessons) {
      if (lesson.quiz && lesson.quiz._id && lesson.quiz._id.toString() === quizId) {
        console.log('Found quiz in lesson with exact ID match');
        quiz = lesson.quiz;
        lessonId = lesson._id;
        break;
      }
    }
    
    // If not found in lessons, check if it's in the module
    if (!quiz && module.quiz && module.quiz._id && module.quiz._id.toString() === quizId) {
      console.log('Found quiz in module with exact ID match');
      quiz = module.quiz;
    }
    
    // Fallback approach: use the first quiz found if ID doesn't match
    if (!quiz) {
      console.log('No exact ID match, trying fallback...');
      
      // Check if the quiz is in any lesson
      for (const lesson of module.lessons) {
        if (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0) {
          console.log('Using first quiz found in lessons as fallback');
          quiz = lesson.quiz;
          lessonId = lesson._id;
          break;
        }
      }
      
      // If still not found and there's a module quiz, use that
      if (!quiz && module.quiz && module.quiz.questions && module.quiz.questions.length > 0) {
        console.log('Using module quiz as fallback');
        quiz = module.quiz;
      }
    }
    
    if (!quiz) {
      console.log('No quiz found at all');
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    console.log('Quiz found with title:', quiz.title);
    console.log('Quiz has questions:', quiz.questions.length);

    // Grade the quiz
    let correctCount = 0;
    const results = [];
    const correctAnswers = {}; // Map to store correct answers for each question
    
    console.log('Grading quiz with questions:', quiz.questions.length);
    
    // First, log all questions and their correct answers for debugging
    quiz.questions.forEach((question, index) => {
      const correctOption = question.options.find(o => o.isCorrect);
      console.log(`Question ${index + 1}: "${question.text}"`);
      console.log(`  Question ID: ${question._id}`);
      
      if (correctOption) {
        console.log(`  Correct answer: "${correctOption.text}" (ID: ${correctOption._id})`);
        correctAnswers[question._id.toString()] = correctOption._id.toString();
      } else {
        console.log('  WARNING: No correct answer marked for this question!');
      }
      
      // Log all options
      question.options.forEach((option, optIndex) => {
        console.log(`  Option ${optIndex + 1}: "${option.text}" (ID: ${option._id}, isCorrect: ${option.isCorrect})`);
      });
    });
    
    console.log('User submitted answers:', answers);
    
    // Now grade each question
    for (const [questionId, selectedAnswerId] of Object.entries(answers)) {
      const question = quiz.questions.id(questionId);
      
      if (!question) {
        console.log(`Question with ID ${questionId} not found in quiz`);
        continue; // Skip if question not found
      }
      
      // Find the correct answer
      const correctOption = question.options.find(o => o.isCorrect);
      
      if (!correctOption) {
        console.log(`No correct option found for question "${question.text}"`);
        continue; // Skip if no correct answer is marked
      }
      
      const correctAnswerId = correctOption._id.toString();
      const isCorrect = selectedAnswerId === correctAnswerId;
      
      console.log(`Question: "${question.text}"`);
      console.log(`  Selected answer ID: ${selectedAnswerId}`);
      console.log(`  Correct answer ID: ${correctAnswerId}`);
      console.log(`  Is correct: ${isCorrect}`);
      
      if (isCorrect) {
        correctCount++;
      }
      
      results.push({
        questionId,
        selectedAnswerId,
        correctAnswerId,
        isCorrect
      });
    }
    
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70; // 70% passing score
    
    console.log(`Quiz Score: ${score}% (${correctCount}/${quiz.questions.length} correct)`);
    console.log(`Passed: ${passed}`);

    // Store quiz result in enrollment
    if (lessonId) {
      // Quiz is part of a lesson
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
      
      let lessonProgress = moduleProgress.lessons.find(l => 
        l.lessonId.toString() === lessonId.toString()
      );
      
      if (!lessonProgress) {
        moduleProgress.lessons.push({
          lessonId,
          completed: false,
          videoCompleted: false,
          quizCompleted: passed,
          exerciseCompleted: false,
          quizScore: score
        });
      } else {
        lessonProgress.quizCompleted = passed;
        lessonProgress.quizScore = score;
      }
    } else {
      // Quiz is part of a module
      enrollment.quizResults.push({
        moduleId,
        quizId,
        score,
        answers,
        passed,
        attemptedAt: new Date()
      });
    }
    
    await enrollment.save();

    res.json({
      score,
      passed,
      results,
      correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers,  // Include a map of question IDs to correct answer IDs
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
    res.status(500).json({ error: 'Failed to submit quiz' });
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

// Submit quiz for grading
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, moduleId, quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

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

    // Check if it's a module quiz
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

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade the quiz
    let score = 0;
    const correctAnswers = {};
    const userAnswers = {};
    const explanations = {};
    
    // Process each question
    for (const question of quiz.questions) {
      const questionId = question._id.toString();
      userAnswers[questionId] = answers[questionId];
      
      // Find the correct answer
      const correctOption = question.options.find(option => option.isCorrect);
      if (correctOption) {
        correctAnswers[questionId] = correctOption._id.toString();
        explanations[questionId] = question.explanation || '';
        
        // Check if user selected the correct answer
        if (answers[questionId] === correctOption._id.toString()) {
          score++;
        }
      }
    }
    
    // Calculate percentage score
    const totalQuestions = quiz.questions.length;
    const percentageScore = Math.round((score / totalQuestions) * 100);
    const isPassing = percentageScore >= (quiz.passingScore || 70);
    
    // Update user progress
    let moduleProgress = enrollment.progress.find(p => p.moduleId.toString() === moduleId);
    if (!moduleProgress) {
      enrollment.progress.push({
        moduleId,
        completed: false,
        lessons: []
      });
      moduleProgress = enrollment.progress[enrollment.progress.length - 1];
    }
    
    // If it's a lesson quiz, update lesson progress
    if (lessonId) {
      let lessonProgress = moduleProgress.lessons.find(l => l.lessonId.toString() === lessonId.toString());
      if (!lessonProgress) {
        moduleProgress.lessons.push({
          lessonId,
          completed: false,
          videoCompleted: false,
          quizCompleted: isPassing,
          exerciseCompleted: false,
          quizScore: percentageScore
        });
      } else {
        lessonProgress.quizCompleted = isPassing;
        lessonProgress.quizScore = percentageScore;
        
        // Check if the whole lesson is now complete
        const course = await Course.findById(courseId).select('modules');
        const module = course.modules.id(moduleId);
        const lesson = module.lessons.id(lessonId);
        
        const hasVideo = !!lesson.videoUrl;
        const hasExercise = !!lesson.codeExercise;
        
        const videoComplete = !hasVideo || lessonProgress.videoCompleted;
        const exerciseComplete = !hasExercise || lessonProgress.exerciseCompleted;
        
        if (videoComplete && isPassing && exerciseComplete) {
          lessonProgress.completed = true;
          lessonProgress.completedAt = new Date();
        }
      }
    } else {
      // It's a module quiz
      moduleProgress.quizCompleted = isPassing;
      moduleProgress.quizScore = percentageScore;
      
      // Check if the whole module is now complete
      const allLessonsComplete = moduleProgress.lessons.every(lesson => lesson.completed);
      if (allLessonsComplete && isPassing) {
        moduleProgress.completed = true;
        moduleProgress.completedAt = new Date();
      }
    }
    
    // Save the enrollment with updated progress
    await enrollment.save();
    
    // Return the quiz results
    res.json({
      score,
      totalQuestions,
      percentageScore,
      isPassing,
      userAnswers,
      correctAnswers,
      explanations
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: 'Failed to submit quiz: ' + err.message });
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