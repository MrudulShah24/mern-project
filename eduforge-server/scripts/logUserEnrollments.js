require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

async function logUserEnrollments() {
  try {
    await connectDB();
    
    // Find the user by name 'Deep Vaishnav'
    const user = await User.findOne({ name: 'Deep Vaishnav' });
    
    if (!user) {
      console.log('User "Deep Vaishnav" not found');
      mongoose.disconnect();
      return;
    }
    
    console.log('Found user:', {
      name: user.name,
      id: user._id.toString(),
      email: user.email
    });
    
    // Find enrollments for this user
    const enrollments = await Enrollment.find({ user: user._id })
      .populate({
        path: 'course',
        select: 'title'
      });
    
    console.log(`Found ${enrollments.length} enrollments for ${user.name}:`);
    
    // Log each enrollment
    enrollments.forEach(enrollment => {
      console.log(`- Enrollment ID: ${enrollment._id}`);
      console.log(`  Course: ${enrollment.course ? enrollment.course.title : 'Unknown Course'}`);
      console.log(`  Progress: ${enrollment.progressPercentage}%`);
      console.log(`  Enrolled at: ${enrollment.enrolledAt}`);
      console.log(`  User ID in enrollment: ${enrollment.user}`);
      console.log('---');
    });
    
    // Log all available courses
    const courses = await Course.find().select('title');
    console.log(`\nTotal available courses: ${courses.length}`);
    
    // Log if any enrollments are missing
    if (enrollments.length < courses.length) {
      console.log('\nMissing enrollments for these courses:');
      
      const enrolledCourseIds = enrollments.map(e => e.course._id.toString());
      
      const missingCourses = courses.filter(course => !enrolledCourseIds.includes(course._id.toString()));
      
      missingCourses.forEach(course => {
        console.log(`- ${course.title} (${course._id})`);
      });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

logUserEnrollments();