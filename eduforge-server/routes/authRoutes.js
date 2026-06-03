const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema } = require('../utils/schemas');

const passport = require('passport');

// This line simply points the /register URL to your registerUser function
router.post('/register', validate(registerSchema), registerUser);

// This line points the /login URL to your loginUser function
router.post('/login', validate(loginSchema), loginUser);

// @desc    Auth with Google
// @route   GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login?error=oauth_failed' }),
  (req, res) => {
    // Successful authentication, generate JWT
    const token = req.user.generateToken();
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/oauth-callback?token=${token}`);
  }
);

module.exports = router;