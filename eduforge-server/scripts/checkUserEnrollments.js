/**
 * Check User Enrollments Script
 * This script checks enrollments for a specific user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');

async function checkUserEnrollments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // Find Deep Vaishnav's user account
    const user = await User.findOne({ email: /deeptest@gmail.com/i });
    
    if (!user) {
      console.log('User with email deeptest@gmail.com not found');
      return;
    }
    
    console.log('Found user:', user.email, 'ID:', user._id);

    // Get all enrollments for this user
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('course', 'title');
    
    console.log(`Found ${enrollments.length} enrollments for ${user.email}`);
    
    if (enrollments.length === 0) {
      console.log('No enrollments found');
      return;
    }
    
    // List all enrollments
    for (const enrollment of enrollments) {
      if (enrollment.course) {
        console.log(`- Enrolled in: ${enrollment.course.title} (ID: ${enrollment.course._id})`);
        console.log(`  Progress: ${enrollment.progressPercentage}%`);
      } else {
        console.log(`- Invalid enrollment: ${enrollment._id}, course reference is missing`);
      }
    }
    
    // Now let's check all valid courses in the system
    const courses = await Course.find({}).select('title');
    console.log(`\nFound ${courses.length} courses in the system`);
    
    // Create enrollments for courses that the user isn't enrolled in yet
    const enrolledCourseIds = new Set(enrollments.filter(e => e.course).map(e => e.course._id.toString()));
    let newEnrollmentsCount = 0;
    
    for (const course of courses) {
      if (!enrolledCourseIds.has(course._id.toString())) {
        console.log(`Creating enrollment for course: ${course.title}`);
        
        // Create enrollment
        const newEnrollment = new Enrollment({
          user: user._id,
          course: course._id,
          progressPercentage: Math.floor(Math.random() * 30), // 0-30% progress
          progress: []
        });
        
        await newEnrollment.save();
        newEnrollmentsCount++;
      }
    }
    
    console.log(`Created ${newEnrollmentsCount} new enrollments for ${user.email}`);
    
  } catch (err) {
    console.error('Error checking user enrollments:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
checkUserEnrollments();