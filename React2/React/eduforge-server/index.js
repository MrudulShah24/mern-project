const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const courseRoutes = require('./routes/courseRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const userRoutes = require('./routes/userRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

// MODIFY THIS ONE LINE
app.use(cors({
  origin: 'http://localhost:3000', // Specifically allow your React app
  credentials: true,
}));

app.use(express.json());

app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/certificates', certificateRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('Missing MONGO_URI in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();