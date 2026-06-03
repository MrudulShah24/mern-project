// middleware/adminMiddleware.js
const admin = (req, res, next) => {
  // `protect` must have already run and set req.user
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Not authorized as admin' });
};

module.exports = { admin };
