const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// This line simply points the /register URL to your registerUser function
router.post('/register', registerUser);

// This line points the /login URL to your loginUser function
router.post('/login', loginUser);

module.exports = router;