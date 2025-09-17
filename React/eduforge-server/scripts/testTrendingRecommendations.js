const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Load environment variables
dotenv.config();

// Calculate similarity scores (copied from recommendationController)
const calculateCourseSimilarity = (course1, course2) => {
  let score = 0;
  
  if (course1.category === course2.category) score += 5;
  if (course1.subcategory === course2.subcategory) score += 3;
  if (course1.level === course2.level) score += 2;
  
  if (course1.tags && course2.tags) {
    const tags1 = new Set(course1.tags);
    course2.tags.forEach(tag => {
      if (tags1.has(tag)) score += 1;
    });
  }
  
  if (course1.instructor?.toString() === course2.instructor?.toString()) score += 2;
  
  return score;
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduforge')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get a test user
      const user = await User.findOne({ role: 'student' });
      if (!user) {
        console.log('No student found');
        return;
      }
      
      console.log(`Testing recommendations for user: ${user.name} (${user.email})`);
      
      // Get user's enrolled courses
      const userEnrollments = await Enrollment.find({ user: user._id })
        .populate('course')
        .lean();
      
      console.log(`User has ${userEnrollments.length} enrollments`);
      
      // Filter out null courses and get enrolled course IDs
      const validEnrollments = userEnrollments.filter(enrollment => enrollment.course);
      const enrolledCourseIds = validEnrollments.map(enrollment => enrollment.course._id.toString());
      
      // Get all courses
      const allCourses = await Course.find({ 
        _id: { $nin: enrolledCourseIds },
        status: 'published' 
      }).lean();
      
      console.log(`Found ${allCourses.length} available courses (not enrolled)`);
      
      // Generate trending courses based on ratings
      const trendingCourses = await Course.find({
        _id: { $nin: enrolledCourseIds },
        status: 'published'
      })
      .sort({ rating: -1 })
      .limit(8)
      .lean();
      
      console.log('\n--- TRENDING COURSES ---');
      console.log(`Found ${trendingCourses.length} trending courses`);
      trendingCourses.forEach((course, i) => {
        console.log(`${i+1}. ${course.title} - Rating: ${course.rating || 'N/A'}`);
      });
      
      // Generate personalized recommendations
      const completedEnrollments = validEnrollments.filter(e => 
        e.progressPercentage >= 70 || e.completionDate
      );
      
      const inProgressEnrollments = validEnrollments.filter(e => 
        e.progressPercentage > 0 && e.progressPercentage < 70 && !e.completionDate
      );
      
      const completedCourses = completedEnrollments.map(e => e.course);
      const inProgressCourses = inProgressEnrollments.map(e => e.course);
      
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
          course,
          score: totalScore
        };
      });
      
      // Sort by score and get top recommendations
      const personalizedCourses = courseScores
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.course);
      
      console.log('\n--- PERSONALIZED COURSES ---');
      console.log(`Found ${personalizedCourses.length} personalized recommendations`);
      personalizedCourses.forEach((course, i) => {
        console.log(`${i+1}. ${course.title} - Category: ${course.category || 'N/A'}`);
      });
      
    } catch (error) {
      console.error('Error testing recommendations:', error);
    } finally {
      // Close the MongoDB connection
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });