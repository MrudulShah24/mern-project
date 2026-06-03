/**
 * Fix Enrollments Script
 * This script repairs enrollments after courses have been recreated
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

async function fixEnrollments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // Get all enrollments
    const enrollments = await Enrollment.find({});
    console.log(`Found ${enrollments.length} enrollments`);
    
    if (enrollments.length === 0) {
      console.log('No enrollments to fix');
      return;
    }
    
    // Get all courses
    const courses = await Course.find({}).select('title');
    console.log(`Found ${courses.length} courses`);
    
    if (courses.length === 0) {
      console.log('No courses found. Please run seedDummyCourses.js first');
      return;
    }
    
    let fixedCount = 0;
    let brokenCount = 0;

    // Loop through each enrollment
    for (const enrollment of enrollments) {
      try {
        // Check if the course exists
        const courseExists = await Course.findById(enrollment.course);
        
        if (!courseExists) {
          const userId = enrollment.user ? enrollment.user.toString() : 'unknown';
          console.log(`Course ${enrollment.course} for user ${userId} does not exist`);
          
          // Assign this enrollment to a random course
          const randomCourse = courses[Math.floor(Math.random() * courses.length)];
          console.log(`Reassigning to course: ${randomCourse.title}`);
          
          enrollment.course = randomCourse._id;
          
          // Reset progress since it's a different course
          enrollment.progressPercentage = 0;
          enrollment.progress = [];
          enrollment.completedLessons = [];
          enrollment.completionDate = null;
          enrollment.certificateId = null;
          enrollment.quizResults = [];
          enrollment.savedCode = [];
          enrollment.codeSubmissions = [];
          
          await enrollment.save();
          fixedCount++;
        }
      } catch (err) {
        console.error(`Error fixing enrollment ${enrollment._id}:`, err);
        brokenCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} enrollments`);
    console.log(`Failed to fix ${brokenCount} enrollments`);
    console.log('Enrollment fix complete!');
  } catch (err) {
    console.error('Error fixing enrollments:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
fixEnrollments();