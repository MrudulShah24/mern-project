const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

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
  if (course1.instructor.toString() === course2.instructor.toString()) {
    score += 2;
  }
  
  return score;
};

// Get personalized recommendations for a user
exports.getRecommendations = async (req, res) => {
  try {
    // Use either id or _id depending on what's available
    const userId = req.user.id || req.user._id;
    
    console.log('Generating recommendations for user:', userId);

    // Get user's enrolled courses
    const userEnrollments = await Enrollment.find({ user: userId })
      .populate('course')
      .lean();
    
    console.log(`Found ${userEnrollments.length} enrollments`);
    
    // Filter out null courses
    const validEnrollments = userEnrollments.filter(enrollment => enrollment.course);
    const enrolledCourseIds = validEnrollments.map(enrollment => enrollment.course._id.toString());
    
    // Get user's interests based on enrolled and completed courses
    const completedEnrollments = validEnrollments.filter(e => 
      e.progressPercentage >= 70 || e.completionDate
    );
    
    // Get in-progress courses
    const inProgressEnrollments = validEnrollments.filter(e => 
      e.progressPercentage > 0 && e.progressPercentage < 70 && !e.completionDate
    );
    
    // Extract completed and in-progress courses
    const completedCourses = completedEnrollments.map(e => e.course);
    const inProgressCourses = inProgressEnrollments.map(e => e.course);
    
    // Extract interests from user's courses
    const userInterests = new Set();
    const userTags = new Set();
    const userCategories = new Set();
    const userSubcategories = new Set();
    const userLevels = new Set();
    const userInstructors = new Set();
    
    [...completedCourses, ...inProgressCourses].forEach(course => {
      if (course.category) userCategories.add(course.category);
      if (course.subcategory) userSubcategories.add(course.subcategory);
      if (course.level) userLevels.add(course.level);
      if (course.instructor) userInstructors.add(course.instructor.toString());
      
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach(tag => userTags.add(tag));
      }
      
      if (course.category) userInterests.add(course.category);
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach(tag => userInterests.add(tag));
      }
    });
    
    console.log('User interests:', Array.from(userInterests));
    
    // COLLABORATIVE FILTERING - Find similar users and their courses
    // First, get all users who have completed similar courses
    const similarUserEnrollments = await Enrollment.find({
      user: { $ne: userId },
      course: { $in: completedCourses.map(c => c._id) },
      progressPercentage: { $gte: 70 }
    }).distinct('user');
    
    console.log(`Found ${similarUserEnrollments.length} similar users`);
    
    // Get courses that similar users have enrolled in but the current user hasn't
    let collaborativeCourses = [];
    if (similarUserEnrollments.length > 0) {
      const similarUserCourses = await Enrollment.find({
        user: { $in: similarUserEnrollments },
        course: { $nin: enrolledCourseIds }
      })
      .populate('course')
      .lean();
      
      // Count course frequency among similar users to establish popularity
      const courseCounts = {};
      similarUserCourses.forEach(enrollment => {
        if (enrollment.course) {
          const courseId = enrollment.course._id.toString();
          courseCounts[courseId] = (courseCounts[courseId] || 0) + 1;
        }
      });
      
      // Filter unique courses and sort by frequency
      const uniqueCourses = {};
      similarUserCourses.forEach(enrollment => {
        if (enrollment.course) {
          uniqueCourses[enrollment.course._id.toString()] = enrollment.course;
        }
      });
      
      collaborativeCourses = Object.values(uniqueCourses)
        .sort((a, b) => {
          const countA = courseCounts[a._id.toString()] || 0;
          const countB = courseCounts[b._id.toString()] || 0;
          return countB - countA;
        })
        .slice(0, 8);
        
      console.log(`Found ${collaborativeCourses.length} collaborative courses`);
    }
    
    // CONTENT-BASED FILTERING - Find courses similar to what the user likes
    // Get all courses
    const allCourses = await Course.find({ 
      _id: { $nin: enrolledCourseIds },
      status: 'published' 
    }).lean();
    
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
    const contentBasedCourses = courseScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.course);
      
    console.log(`Found ${contentBasedCourses.length} content-based courses`);
    
    // Get trending courses (most enrollments in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await Enrollment.find({
      enrolledAt: { $gte: thirtyDaysAgo }
    }).lean();
    
    // Count enrollments per course
    const courseTrendCounts = {};
    recentEnrollments.forEach(enrollment => {
      const courseId = enrollment.course?.toString();
      if (courseId) {
        courseTrendCounts[courseId] = (courseTrendCounts[courseId] || 0) + 1;
      }
    });
    
    // Get course details for trending courses
    const trendingCourseIds = Object.keys(courseTrendCounts)
      .filter(id => !enrolledCourseIds.includes(id))
      .sort((a, b) => courseTrendCounts[b] - courseTrendCounts[a])
      .slice(0, 8);
      
    let trendingCourses = await Course.find({ 
      _id: { $in: trendingCourseIds },
      status: 'published'
    }).lean();
    
    // If no trending courses are found, use the top rated courses as trending
    if (trendingCourses.length === 0) {
      trendingCourses = await Course.find({
        _id: { $nin: enrolledCourseIds },
        status: 'published'
      })
      .sort({ rating: -1 })
      .limit(8)
      .lean();
    }
    
    console.log(`Found ${trendingCourses.length} trending courses`);
    
    // Level progression courses - suggest next level courses in the same category
    const levelProgression = {
      'Beginner': 'Intermediate',
      'Intermediate': 'Advanced'
    };
    
    const userCompletedLevels = new Map();
    
    // Track completed categories and their levels
    completedCourses.forEach(course => {
      if (course.category && course.level) {
        const currentLevel = userCompletedLevels.get(course.category) || '';
        
        // Update to the higher completed level
        if (course.level === 'Advanced' || 
            (course.level === 'Intermediate' && currentLevel !== 'Advanced')) {
          userCompletedLevels.set(course.category, course.level);
        } else if (!currentLevel && course.level === 'Beginner') {
          userCompletedLevels.set(course.category, 'Beginner');
        }
      }
    });
    
    // For each category the user has completed a level in, find the next level
    const nextLevelPromises = Array.from(userCompletedLevels.entries()).map(async ([category, level]) => {
      // Skip if already at Advanced level
      if (level === 'Advanced') return [];
      
      // Get the next level
      const nextLevel = levelProgression[level];
      if (!nextLevel) return [];
      
      // Find courses in the same category but next level
      return Course.find({
        _id: { $nin: enrolledCourseIds },
        category: category,
        level: nextLevel,
        status: 'published'
      }).lean();
    });
    
    const nextLevelResults = await Promise.all(nextLevelPromises);
    const nextLevelCourses = nextLevelResults.flat().slice(0, 8);
    
    console.log(`Found ${nextLevelCourses.length} next level courses`);
    
    // Check if user is enrolled in all courses
    const isEnrolledInAllCourses = allCourses.length === 0;
    
    res.json({
      personalized: contentBasedCourses,
      collaborative: collaborativeCourses,
      trending: trendingCourses,
      nextSteps: nextLevelCourses,
      isEnrolledInAllCourses: isEnrolledInAllCourses
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};