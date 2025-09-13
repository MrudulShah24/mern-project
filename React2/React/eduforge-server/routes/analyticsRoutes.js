const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { 
  getCourseAnalytics,
  getProgressStats,
  getQuizStats,
  getEnrollmentAnalytics
} = require('../controllers/analyticsController');

// Get course analytics
router.get('/courses/:id/analytics', protect, getCourseAnalytics);

// Get course progress statistics
router.get('/courses/:id/progress-stats', protect, getProgressStats);

// Get course quiz statistics
router.get('/courses/:id/quiz-stats', protect, getQuizStats);

// Get overall enrollment analytics (admin only)
router.get('/enrollments', protect, admin, getEnrollmentAnalytics);

module.exports = router;
