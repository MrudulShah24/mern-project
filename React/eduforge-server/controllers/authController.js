const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ REGISTER LOGIC LIVES HERE
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const newUser = new User({
      name,
      email,
      password: password, // The password will be hashed by the pre-save middleware
      role: 'student', // All new registrations are students
    });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully. Please log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// ✅ LOGIN LOGIC LIVES HERE
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Use the matchPassword method from the User model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token using the model method
    const token = user.generateToken();
    
    // Ensure consistent ID format
    const userId = user._id.toString();
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: userId,
        id: userId, // Include both formats for compatibility
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };