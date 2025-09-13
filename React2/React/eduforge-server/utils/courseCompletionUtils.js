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

    // Check if all modules are completed
    const totalModules = course.modules.length;
    
    // If enrollment has progress of 100%, mark as completed
    const isCompleted = enrollment.progress === 100;

    // If not completed, return progress
    if (!isCompleted) {
      return { 
        success: false, 
        message: 'Course not completed yet',
        progress: enrollment.progress,
        requiredProgress: 100
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

    // Create certificate
    const certificate = new Certificate({
      student: userId,
      course: courseId,
      instructor: course.instructor._id,
      completedAt: enrollment.completionDate || new Date(),
      grade,
      metadata: {
        courseDuration: course.duration,
        modulesCompleted: totalModules,
        totalModules,
        completionPercentage: 100
      }
    });

    await certificate.save();

    // Update enrollment with certificate reference
    enrollment.certificateId = certificate.certificateId;
    await enrollment.save();

    return {
      success: true,
      message: 'Certificate generated successfully',
      certificateId: certificate.certificateId
    };
  } catch (error) {
    console.error('Course completion check error:', error);
    return { success: false, message: 'Error checking course completion', error };
  }
};

module.exports = { checkCourseCompletion };