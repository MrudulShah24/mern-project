const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('./middleware/mongoSanitize');
require('dotenv').config();

const courseRoutes = require('./routes/courseRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const userRoutes = require('./routes/userRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const adminRoutes = require('./routes/adminRoutes');

const session = require('express-session');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for local development where client is separate, or customize if deploying
}));

// Limit requests from same IP (DDoS/Brute force protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to auth routes
app.use('/api/auth/', limiter);

// MODIFY THIS ONE LINE
app.use(cors({
  origin: 'http://localhost:3000', // Specifically allow your React app
  credentials: true,
}));

app.use(express.json());

// Data sanitization against NoSQL query injection (must run after express.json)
app.use(mongoSanitize());

app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('Missing MONGO_URI in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();