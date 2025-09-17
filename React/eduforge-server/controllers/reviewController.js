const Course = require('../models/Course');
const Review = require('../models/Review');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all reviews for a course with sorting and filtering
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sort = 'newest', filter = 'all' } = req.query;
    
    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Build query
    let query = { course: courseId };
    
    // Apply filters
    if (filter !== 'all') {
      if (['1', '2', '3', '4', '5'].includes(filter)) {
        query.rating = parseInt(filter);
      } else if (filter === 'completed') {
        query.courseCompletionPercentage = 100;
      }
    }
    
    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { rating: -1 };
        break;
      case 'lowest':
        sortOptions = { rating: 1 };
        break;
      case 'helpful':
        sortOptions = { helpfulCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const reviews = await Review.find(query)
      .sort(sortOptions)
      .populate('user', 'name avatar')
      .lean();
    
    res.json(reviews);
  } catch (err) {
    console.error('Error getting course reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Get review statistics for a course
exports.getReviewStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get total reviews and average rating
    const stats = await Review.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      { $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: { 
            $push: '$rating'
          }
        }
      }
    ]);
    
    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    if (stats.length > 0) {
      stats[0].ratingCounts.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }
    
    const response = {
      averageRating: stats.length > 0 ? stats[0].averageRating : 0,
      totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
      ratingDistribution
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error getting review stats:', err);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
};

// Get the current user's review for a course
exports.getUserReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findOne({
      course: courseId,
      user: userId
    }).populate('user', 'name avatar');
    
    if (!review) {
      return res.status(404).json(null);
    }
    
    res.json(review);
  } catch (err) {
    console.error('Error getting user review:', err);
    res.status(500).json({ error: 'Failed to fetch user review' });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user has already reviewed this course
    const existingReview = await Review.findOne({
      course: courseId,
      user: userId
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this course' });
    }
    
    const { rating, title, content, helpfulness, courseCompletionPercentage } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const newReview = new Review({
      course: courseId,
      user: userId,
      rating,
      title: title || 'Review',
      content,
      helpfulness: helpfulness || 0,
      courseCompletionPercentage: courseCompletionPercentage || 0,
      helpfulCount: 0
    });
    
    await newReview.save();
    
    // Populate user data before sending response
    await newReview.populate('user', 'name avatar');
    
    // Update course rating
    await updateCourseRating(courseId);
    
    res.status(201).json(newReview);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the review belongs to the user
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }
    
    const { rating, title, content, helpfulness, courseCompletionPercentage } = req.body;
    
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }
    
    if (title) review.title = title;
    if (content) review.content = content;
    if (helpfulness !== undefined) review.helpfulness = helpfulness;
    if (courseCompletionPercentage !== undefined) review.courseCompletionPercentage = courseCompletionPercentage;
    
    review.updatedAt = Date.now();
    await review.save();
    
    // Populate user data before sending response
    await review.populate('user', 'name avatar');
    
    // Update course rating
    await updateCourseRating(courseId);
    
    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the review belongs to the user or user is admin
    if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    // Update course rating
    await updateCourseRating(courseId);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Mark a review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the user is trying to mark their own review
    if (review.user.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot mark your own review as helpful' });
    }
    
    // Check if the user has already marked this review
    if (review.helpfulBy && review.helpfulBy.includes(userId)) {
      // Remove the mark
      review.helpfulBy = review.helpfulBy.filter(id => id.toString() !== userId.toString());
    } else {
      // Add the mark
      if (!review.helpfulBy) {
        review.helpfulBy = [];
      }
      review.helpfulBy.push(userId);
    }
    
    // Update helpful count
    review.helpfulCount = review.helpfulBy.length;
    
    await review.save();
    
    res.json({ helpfulCount: review.helpfulCount });
  } catch (err) {
    console.error('Error marking review as helpful:', err);
    res.status(500).json({ error: 'Failed to mark review as helpful' });
  }
};

// Report a review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the user has already reported this review
    if (review.reportedBy && review.reportedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already reported this review' });
    }
    
    // Add the report
    if (!review.reportedBy) {
      review.reportedBy = [];
    }
    review.reportedBy.push(userId);
    
    // Set the report count
    review.reportCount = review.reportedBy.length;
    
    // If more than 3 reports, flag for moderation
    if (review.reportCount >= 3) {
      review.flaggedForModeration = true;
    }
    
    await review.save();
    
    res.json({ message: 'Review reported successfully' });
  } catch (err) {
    console.error('Error reporting review:', err);
    res.status(500).json({ error: 'Failed to report review' });
  }
};

// Helper function to update course rating
const updateCourseRating = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { course: mongoose.Types.ObjectId(courseId) } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
  const reviewCount = stats.length > 0 ? stats[0].reviewCount : 0;
  
  await Course.findByIdAndUpdate(courseId, {
    rating: averageRating,
    reviewCount: reviewCount
  });
};