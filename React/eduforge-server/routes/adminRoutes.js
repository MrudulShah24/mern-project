// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const generateSampleData = require('../utils/dummyCoursesGenerator');

/**
 * Generate dummy courses
 * POST /api/admin/generate-courses
 * Admin only
 */
router.post('/generate-courses', protect, admin, async (req, res) => {
  try {
    console.log('Starting sample course generation from API request...');
    await generateSampleData();
    res.status(200).json({ message: 'Sample courses generated successfully' });
  } catch (error) {
    console.error('Error generating sample courses:', error);
    res.status(500).json({ error: 'Failed to generate sample courses' });
  }
});

/**
 * Check server status
 * GET /api/admin/status
 * Admin only
 */
router.get('/status', protect, admin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Get database stats
    const dbStats = {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
    };
    
    // Get collection counts
    const Course = require('../models/Course');
    const User = require('../models/User');
    const Enrollment = require('../models/Enrollment');
    const Review = require('../models/Review');
    
    const counts = await Promise.all([
      Course.countDocuments(),
      User.countDocuments(),
      Enrollment.countDocuments(),
      Review.countDocuments()
    ]);
    
    res.status(200).json({
      status: 'ok',
      database: dbStats,
      counts: {
        courses: counts[0],
        users: counts[1],
        enrollments: counts[2],
        reviews: counts[3]
      }
    });
  } catch (error) {
    console.error('Error checking server status:', error);
    res.status(500).json({ error: 'Failed to check server status' });
  }
});

module.exports = router;