require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

async function unenrollFromSomeCourses() {
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
    
    // Get all courses
    const allCourses = await Course.find();
    console.log(`Found ${allCourses.length} total courses`);
    
    // Get current enrollments
    const enrollments = await Enrollment.find({ user: user._id });
    console.log(`User has ${enrollments.length} enrollments`);
    
    // Randomly select half of the enrollments to delete
    const enrollmentsToKeep = Math.ceil(enrollments.length / 2);
    const shuffled = enrollments.sort(() => 0.5 - Math.random());
    const enrollmentsToDelete = shuffled.slice(enrollmentsToKeep);
    
    console.log(`Keeping ${enrollmentsToKeep} enrollments and deleting ${enrollmentsToDelete.length} enrollments`);
    
    // Delete selected enrollments
    const deleteResults = await Promise.all(
      enrollmentsToDelete.map(enrollment => 
        Enrollment.findByIdAndDelete(enrollment._id)
      )
    );
    
    console.log(`Successfully unenrolled from ${deleteResults.length} courses`);
    
    // Get remaining enrollments
    const remainingEnrollments = await Enrollment.find({ user: user._id })
      .populate('course', 'title');
    
    console.log('\nRemaining enrollments:');
    remainingEnrollments.forEach((enrollment, index) => {
      console.log(`${index + 1}. ${enrollment.course?.title || 'Unknown course'}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

unenrollFromSomeCourses();