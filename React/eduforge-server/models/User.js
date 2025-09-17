const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'admin', 'instructor'], 
    default: 'student' 
  },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
  // Make sure JWT_SECRET is defined
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  // Ensure consistent ID format by converting to string
  const userId = this._id.toString();
  
  console.log('Generating token for user:', this.name, 'with ID:', userId);
  
  return jwt.sign(
    { 
      id: userId, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// ✅ FIX: prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
