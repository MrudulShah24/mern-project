const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/enrollments
// @desc    Enroll in a course
// @access  Private
router.post('/', authMiddleware, enrollmentController.enrollInCourse);

// @route   GET api/enrollments/my-enrollments
// @desc    Get all enrollments for the current user
// @access  Private
router.get('/my-enrollments', authMiddleware, enrollmentController.getMyEnrollments);

// @route   GET api/enrollments/:id
// @desc    Get a single enrollment by ID
// @access  Private
router.get('/:id', authMiddleware, enrollmentController.getEnrollmentById);

// @route   PUT api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private
router.put('/:id/progress', authMiddleware, enrollmentController.updateProgress);

module.exports = router;
