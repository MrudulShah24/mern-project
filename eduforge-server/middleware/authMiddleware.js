const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header is present
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (but without password)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Ensure both id and _id are available
      req.user = {
        ...user.toObject(),
        id: user._id.toString()
      };

      console.log('Auth middleware - User ID:', req.user.id, 'User _id:', req.user._id);

      next();
      return;
    } catch (error) {
      console.error('Auth error:', error.message);
      res.status(401).json({ error: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    // If no token is present, we should return immediately
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Support both default and named imports
module.exports = protect;
module.exports.protect = protect;
