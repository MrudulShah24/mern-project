/**
 * Create Test Enrollments Script
 * This script creates test enrollments for users in courses
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

async function createTestEnrollments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // Get all users
    const users = await User.find({}).select('_id email');
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }
    
    // Get all courses
    const courses = await Course.find({}).select('_id title');
    console.log(`Found ${courses.length} courses`);
    
    if (courses.length === 0) {
      console.log('No courses found. Please run seedDummyCourses.js first');
      return;
    }
    
    let enrollmentCount = 0;
    let errorCount = 0;

    // For each user, enroll in 2-4 random courses
    for (const user of users) {
      // Get existing enrollments for this user
      const existingEnrollments = await Enrollment.find({ user: user._id }).select('course');
      const existingCourseIds = existingEnrollments.map(e => e.course.toString());
      
      console.log(`User ${user.email} has ${existingEnrollments.length} existing enrollments`);
      
      // If user already has enrollments, skip
      if (existingEnrollments.length >= 3) {
        console.log(`User ${user.email} already has enough enrollments`);
        continue;
      }
      
      // Get courses user is not enrolled in
      const availableCourses = courses.filter(c => !existingCourseIds.includes(c._id.toString()));
      
      // Determine how many courses to enroll in
      const enrollmentTarget = Math.floor(Math.random() * 3) + 2; // 2-4 courses
      const enrollmentsToCreate = Math.min(enrollmentTarget - existingEnrollments.length, availableCourses.length);
      
      if (enrollmentsToCreate <= 0) {
        console.log(`No available courses for user ${user.email} to enroll in`);
        continue;
      }
      
      console.log(`Enrolling user ${user.email} in ${enrollmentsToCreate} new courses`);
      
      // Shuffle available courses and pick the first few
      const shuffledCourses = availableCourses.sort(() => 0.5 - Math.random());
      const coursesToEnrollIn = shuffledCourses.slice(0, enrollmentsToCreate);
      
      // Create enrollments
      for (const course of coursesToEnrollIn) {
        try {
          const enrollment = new Enrollment({
            user: user._id,
            course: course._id,
            progressPercentage: Math.floor(Math.random() * 30), // 0-30% progress
            progress: [], // Empty progress initially
            lastAccessedAt: new Date()
          });
          
          await enrollment.save();
          console.log(`Enrolled user ${user.email} in course "${course.title}"`);
          enrollmentCount++;
        } catch (err) {
          console.error(`Error enrolling user ${user.email} in course "${course.title}":`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log(`Created ${enrollmentCount} new enrollments`);
    console.log(`Failed to create ${errorCount} enrollments`);
    console.log('Test enrollments creation complete!');
  } catch (err) {
    console.error('Error creating test enrollments:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createTestEnrollments();