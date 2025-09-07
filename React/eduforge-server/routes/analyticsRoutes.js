const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getCourseAnalytics,
  getProgressStats,
  getQuizStats
} = require('../controllers/analyticsController');

// Get course analytics
router.get('/courses/:id/analytics', protect, getCourseAnalytics);

// Get course progress statistics
router.get('/courses/:id/progress-stats', protect, getProgressStats);

// Get course quiz statistics
router.get('/courses/:id/quiz-stats', protect, getQuizStats);

module.exports = router;
