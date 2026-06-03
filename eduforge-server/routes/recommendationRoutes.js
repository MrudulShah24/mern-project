const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

// Get personalized recommendations for the logged-in user
router.get('/', protect, getRecommendations);

module.exports = router;