const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get all reviews for a course with sorting and filtering
router.get('/courses/:courseId/reviews', reviewController.getCourseReviews);

// Get review statistics for a course
router.get('/courses/:courseId/reviews/stats', reviewController.getReviewStats);

// Get the current user's review for a course
router.get('/courses/:courseId/reviews/user', authMiddleware, reviewController.getUserReview);

// Create a new review
router.post('/courses/:courseId/reviews', authMiddleware, reviewController.createReview);

// Update a review
router.put('/courses/:courseId/reviews/:reviewId', authMiddleware, reviewController.updateReview);

// Delete a review
router.delete('/courses/:courseId/reviews/:reviewId', authMiddleware, reviewController.deleteReview);

// Mark a review as helpful
router.post('/courses/:courseId/reviews/:reviewId/helpful', authMiddleware, reviewController.markHelpful);

// Report a review
router.post('/courses/:courseId/reviews/:reviewId/report', authMiddleware, reviewController.reportReview);

module.exports = router;