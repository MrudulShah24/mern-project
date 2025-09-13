const Discussion = require('../models/Discussion');

// Get all discussions for a course
exports.getCourseDiscussions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const discussions = await Discussion.find({ course: courseId })
      .populate('user', 'name avatar')
      .populate('replies.user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(discussions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, type = 'discussion', tags = [] } = req.body;

    const discussion = new Discussion({
      course: courseId,
      user: req.user._id,
      title,
      content,
      type,
      tags
    });

    await discussion.save();
    await discussion.populate('user', 'name avatar');
    
    res.status(201).json(discussion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add a reply to a discussion
exports.addReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    discussion.replies.push({
      user: req.user._id,
      content
    });

    await discussion.save();
    await discussion.populate('replies.user', 'name avatar');

    res.json(discussion.replies[discussion.replies.length - 1]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Toggle upvote on a discussion
exports.toggleUpvote = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    const upvoteIndex = discussion.upvotes.indexOf(userId);
    if (upvoteIndex === -1) {
      discussion.upvotes.push(userId);
    } else {
      discussion.upvotes.splice(upvoteIndex, 1);
    }

    await discussion.save();
    res.json({ upvotes: discussion.upvotes.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark discussion as resolved
exports.markResolved = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { isResolved } = req.body;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Only allow the original poster or an admin to mark as resolved
    if (discussion.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    discussion.isResolved = isResolved;
    await discussion.save();
    res.json({ isResolved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const discussion = await Discussion.findById(discussionId);
    
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Only allow the original poster or an admin to delete
    if (discussion.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await discussion.remove();
    res.json({ message: 'Discussion deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get recent discussions for a user
exports.getUserDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({ user: req.user._id })
      .populate('course', 'title')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(discussions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
