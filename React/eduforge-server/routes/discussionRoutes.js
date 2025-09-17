const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCourseDiscussions,
  createDiscussion,
  addReply,
  toggleUpvote,
  markResolved,
  deleteDiscussion,
  getUserDiscussions
} = require('../controllers/discussionController');

// Get all discussions for a course
router.get('/course/:courseId', protect, getCourseDiscussions);

// Create a new discussion
router.post('/course/:courseId', protect, createDiscussion);

// Add a reply to a discussion
router.post('/:discussionId/reply', protect, addReply);

// Toggle upvote on a discussion
router.post('/:discussionId/upvote', protect, toggleUpvote);

// Mark discussion as resolved
router.put('/:discussionId/resolve', protect, markResolved);

// Delete a discussion
router.delete('/:discussionId', protect, deleteDiscussion);

// Get user's recent discussions
router.get('/user/recent', protect, getUserDiscussions);

module.exports = router;
