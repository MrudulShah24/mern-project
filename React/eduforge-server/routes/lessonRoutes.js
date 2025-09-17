const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get lesson content with progress
router.get('/courses/:courseId/modules/:moduleId/lessons/:lessonId', 
  lessonController.getLessonContent);

// Update lesson progress (video, quiz, exercise completion)
router.post('/courses/:courseId/modules/:moduleId/lessons/:lessonId/progress', 
  lessonController.updateLessonProgress);

// Mark a lesson as fully completed
router.post('/courses/:courseId/modules/:moduleId/lessons/:lessonId/complete', 
  lessonController.markLessonComplete);

// Submit quiz for grading
router.post('/courses/:courseId/modules/:moduleId/quizzes/:quizId/submit', 
  lessonController.submitQuiz);

// Save user code for an exercise (without submission)
router.post('/courses/:courseId/modules/:moduleId/lessons/:lessonId/code/save', 
  lessonController.saveCode);

// Get user's saved code for an exercise
router.get('/courses/:courseId/modules/:moduleId/lessons/:lessonId/code', 
  lessonController.getSavedCode);

// Submit code for exercise evaluation
router.post('/courses/:courseId/modules/:moduleId/lessons/:lessonId/code/submit', 
  lessonController.submitCode);

// Run code without submitting (for practice/testing)
router.post('/code/run', lessonController.runCode);

module.exports = router;