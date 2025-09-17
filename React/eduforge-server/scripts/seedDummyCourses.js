/**
 * Seed Script for Dummy Courses
 * Run this script to populate the database with professional-quality sample courses
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const generateSampleData = require('../utils/dummyCoursesGenerator');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected');
  
  // Check if we already have courses
  const courseCount = await Course.countDocuments();
  console.log(`Found ${courseCount} existing courses`);
  
  if (courseCount >= 10) {
    console.log('Database already has a sufficient number of courses. Skipping seed.');
    console.log('If you want to regenerate all courses, use the --force flag');
    console.log('WARNING: Regenerating courses will break existing enrollments!');
    
    const forceReset = process.argv.includes('--force');
    
    if (!forceReset) {
      mongoose.connection.close();
      process.exit(0);
      return;
    }
    
    console.log('Force flag detected. Proceeding with course regeneration...');
    console.log('WARNING: This will break existing enrollments! Run fixEnrollments.js after this completes.');
    
    try {
      await mongoose.connection.db.collection('courses').drop();
      console.log('Dropped existing courses collection');
    } catch (err) {
      console.log('No existing courses collection to drop');
    }
  }
  
  generateSampleData().then(() => {
    console.log('Sample data generation complete!');
    mongoose.connection.close();
    process.exit(0);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});