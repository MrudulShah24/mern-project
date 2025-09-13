const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { checkCourseCompletion } = require('../utils/courseCompletionUtils');

// Enroll in a course
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    
    // Get the course to update its enrolledStudents array as well
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled in the Course model
    const alreadyEnrolledInCourse = course.enrolledStudents.some(
      (s) => s.student && s.student.toString() === userId
    );
    
    // Create a new enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
    });

    // Add to enrolledStudents in Course model if not already there
    if (!alreadyEnrolledInCourse) {
      course.enrolledStudents.push({ student: userId });
      await course.save();
    }

    await enrollment.save();
    res.status(201).json({ message: 'Successfully enrolled in the course', enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all enrollments for the current user
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          model: 'User',
          select: 'name'
        }
      });
      
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single enrollment by ID
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course').populate('user');
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update enrollment progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress, completedLessons } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Ensure the user owns the enrollment
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    enrollment.progress = progress;
    if (completedLessons) {
      enrollment.completedLessons = completedLessons;
    }
    
    if (progress === 100 && !enrollment.completionDate) {
      enrollment.completionDate = Date.now();
    }

    await enrollment.save();
    
    // Check if course is completed and auto-generate certificate
    if (progress === 100) {
      const { checkCourseCompletion } = require('../utils/courseCompletionUtils');
      const completionResult = await checkCourseCompletion(req.user.id, enrollment.course);
      
      if (completionResult.success) {
        return res.json({
          enrollment,
          completionStatus: completionResult
        });
      }
    }
    
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Check certificate eligibility for a course
exports.checkCertificateEligibility = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const result = await checkCourseCompletion(userId, courseId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Check if user is enrolled in a course
exports.checkEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    // Check both enrollment models
    const [enrollmentRecord, course] = await Promise.all([
      // Check Enrollment model
      Enrollment.findOne({ user: userId, course: courseId }),
      // Check Course model
      Course.findOne({ 
        _id: courseId,
        'enrolledStudents.student': userId
      })
    ]);
    
    const isEnrolled = !!(enrollmentRecord || (course && course.enrolledStudents.some(
      s => s.student.toString() === userId
    )));
    
    if (isEnrolled) {
      // If enrolled in Course model but not in Enrollment model, create the enrollment record
      if (!enrollmentRecord && course) {
        const newEnrollment = new Enrollment({
          user: userId,
          course: courseId
        });
        await newEnrollment.save();
      }
      
      return res.json({ 
        enrolled: true,
        enrollment: enrollmentRecord || { user: userId, course: courseId, progress: 0 },
        message: 'You are enrolled in this course'
      });
    }
    
    res.json({ 
      enrolled: false,
      message: 'You are not enrolled in this course'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
