const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

/**
 * Check if a course is completed by a user and generate certificate if needed
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} - Certificate data or completion status
 */
const checkCourseCompletion = async (userId, courseId) => {
  try {
    // Get enrollment to check progress
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) {
      return { success: false, message: 'User not enrolled in this course' };
    }

    // Get course to check modules
    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return { success: false, message: 'Course not found' };
    }

    // Get total lessons in the course
    const totalLessons = course.modules.reduce((total, module) => {
      return total + module.lessons.length;
    }, 0);
    
    // Count completed lessons in the enrollment
    let completedLessons = 0;
    if (enrollment.progress && enrollment.progress.length > 0) {
      completedLessons = enrollment.progress.reduce((total, moduleProgress) => {
        return total + moduleProgress.lessons.filter(lesson => lesson.completed).length;
      }, 0);
    }
    
    // Calculate completion percentage
    const completionPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    // For backward compatibility, check both progress styles
    // If enrollment has progressPercentage of 100% or all lessons completed, mark as completed
    const isCompleted = enrollment.progressPercentage === 100 || completionPercentage === 100;

    // If not completed, return progress
    if (!isCompleted) {
      return { 
        success: false, 
        message: 'Course not completed yet',
        progress: enrollment.progressPercentage || completionPercentage,
        requiredProgress: 100,
        completedLessons,
        totalLessons
      };
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ 
      student: userId, 
      course: courseId 
    });

    if (existingCertificate) {
      return { 
        success: true, 
        message: 'Certificate already exists',
        certificateId: existingCertificate.certificateId
      };
    }

    // Calculate grade based on progress and completion time
    let grade = 'Pass';
    const completionTimeInDays = (new Date() - enrollment.createdAt) / (1000 * 60 * 60 * 24);
    
    // Award better grades for faster completion (example logic)
    if (completionTimeInDays < 7) {
      grade = 'A+';
    } else if (completionTimeInDays < 14) {
      grade = 'A';
    } else if (completionTimeInDays < 21) {
      grade = 'B+';
    }

    // Calculate quiz average if available
    let quizAverage = null;
    if (enrollment.progress && enrollment.progress.length > 0) {
      let totalQuizzes = 0;
      let totalScore = 0;
      
      enrollment.progress.forEach(moduleProgress => {
        moduleProgress.lessons.forEach(lesson => {
          if (lesson.quizCompleted) {
            totalQuizzes++;
            totalScore += lesson.quizScore || 0;
          }
        });
      });
      
      if (totalQuizzes > 0) {
        quizAverage = Math.round(totalScore / totalQuizzes);
        
        // Adjust grade based on quiz performance
        if (quizAverage >= 90) {
          grade = 'A+';
        } else if (quizAverage >= 80) {
          grade = 'A';
        } else if (quizAverage >= 70) {
          grade = 'B+';
        } else if (quizAverage >= 60) {
          grade = 'B';
        }
      }
    }

    // Create certificate
    // Generate a unique certificate ID and verification code
    const certificateId = `CERT-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
    const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Get instructor ID (handle case where instructor might be missing)
    const instructorId = course.instructor && 
      (typeof course.instructor === 'object' ? course.instructor._id : course.instructor);
    
    const certificate = new Certificate({
      certificateId,
      verificationCode,
      student: userId,
      course: courseId,
      instructor: instructorId || new mongoose.Types.ObjectId(), // Use a placeholder if instructor is missing
      completedAt: enrollment.completionDate || new Date(),
      grade,
      metadata: {
        courseDuration: course.duration,
        modulesCompleted: course.modules.length,
        totalModules: course.modules.length,
        completionPercentage: 100,
        quizAverage
      }
    });

    await certificate.save();

    // Update enrollment with certificate reference
    enrollment.certificateId = certificate.certificateId;
    await enrollment.save();

    return {
      success: true,
      message: 'Certificate generated successfully',
      certificateId: certificate.certificateId,
      grade
    };
  } catch (error) {
    console.error('Course completion check error:', error);
    return { success: false, message: 'Error checking course completion', error };
  }
};

module.exports = { checkCourseCompletion };