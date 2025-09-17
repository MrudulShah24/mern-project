require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

// Helper function to calculate course similarity scores
const calculateCourseSimilarity = (course1, course2) => {
  let score = 0;
  
  // Category match is heavily weighted
  if (course1.category === course2.category) {
    score += 5;
  }
  
  // Subcategory match
  if (course1.subcategory === course2.subcategory) {
    score += 3;
  }
  
  // Level match
  if (course1.level === course2.level) {
    score += 2;
  }
  
  // Tags overlap
  if (course1.tags && course2.tags) {
    const tags1 = new Set(course1.tags);
    course2.tags.forEach(tag => {
      if (tags1.has(tag)) {
        score += 1;
      }
    });
  }
  
  // Instructor match
  if (course1.instructor && course2.instructor && 
      course1.instructor.toString() === course2.instructor.toString()) {
    score += 2;
  }
  
  return score;
};

async function testRecommendationAlgorithm() {
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
    
    // Get user's enrolled courses with progress
    const userEnrollments = await Enrollment.find({ user: user._id })
      .populate('course')
      .lean();
    
    console.log(`Found ${userEnrollments.length} enrollments`);
    
    // Filter out null courses
    const validEnrollments = userEnrollments.filter(enrollment => enrollment.course);
    const enrolledCourseIds = validEnrollments.map(enrollment => enrollment.course._id.toString());
    
    // Get user's completed courses
    const completedEnrollments = validEnrollments.filter(e => 
      e.progressPercentage >= 70 || e.completionDate
    );
    
    // Get in-progress courses
    const inProgressEnrollments = validEnrollments.filter(e => 
      e.progressPercentage > 0 && e.progressPercentage < 70 && !e.completionDate
    );
    
    console.log(`Completed courses: ${completedEnrollments.length}`);
    console.log(`In-progress courses: ${inProgressEnrollments.length}`);
    
    // Extract completed and in-progress courses
    const completedCourses = completedEnrollments.map(e => e.course);
    const inProgressCourses = inProgressEnrollments.map(e => e.course);
    
    // Extract user interests
    const userCategories = new Set();
    const userTags = new Set();
    
    [...completedCourses, ...inProgressCourses].forEach(course => {
      if (course.category) userCategories.add(course.category);
      
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach(tag => userTags.add(tag));
      }
    });
    
    console.log('User categories:', Array.from(userCategories));
    console.log('User tags:', Array.from(userTags));
    
    // Get all courses not enrolled in
    const allCourses = await Course.find({ 
      _id: { $nin: enrolledCourseIds },
      status: 'published' 
    }).lean();
    
    console.log(`Found ${allCourses.length} unenrolled courses`);
    
    // Calculate similarity scores for each course
    const courseScores = allCourses.map(course => {
      let totalScore = 0;
      
      // Compare with completed courses
      completedCourses.forEach(userCourse => {
        totalScore += calculateCourseSimilarity(userCourse, course);
      });
      
      // Compare with in-progress courses with higher weight
      inProgressCourses.forEach(userCourse => {
        totalScore += calculateCourseSimilarity(userCourse, course) * 1.5;
      });
      
      return {
        course: {
          _id: course._id,
          title: course.title,
          category: course.category,
          level: course.level
        },
        score: totalScore
      };
    });
    
    // Sort by score and get top recommendations
    const topRecommendations = courseScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    console.log('\nTop 5 content-based recommendations:');
    topRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.course.title} (Score: ${rec.score})`);
      console.log(`   Category: ${rec.course.category}, Level: ${rec.course.level}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

testRecommendationAlgorithm();