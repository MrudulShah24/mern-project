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

// @route   GET api/enrollments/certificate-eligibility/:courseId
// @desc    Check if user is eligible for a certificate
// @access  Private
router.get('/certificate-eligibility/:courseId', authMiddleware, enrollmentController.checkCertificateEligibility);

// @route   GET api/enrollments/status/:courseId
// @desc    Check if user is enrolled in a course
// @access  Private
router.get('/status/:courseId', authMiddleware, enrollmentController.checkEnrollmentStatus);

module.exports = router;
