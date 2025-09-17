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
    const course = await Course.findById(courseId).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if instructor exists, but don't prevent enrollment if missing
    if (!course.instructor) {
      console.warn(`Warning: Course ${courseId} has no valid instructor assigned`);
      // Continue with enrollment anyway for dummy courses
    }
    
    // Check if already enrolled in the Course model
    const alreadyEnrolledInCourse = course.enrolledStudents && 
      course.enrolledStudents.some(
        (s) => s.student && s.student.toString() === userId
      );
    
    // Create a new enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
    });

    // Initialize progress tracking for this course's modules and lessons
    if (course.modules && course.modules.length > 0) {
      enrollment.progress = course.modules.map(module => ({
        moduleId: module._id,
        completed: false,
        lessons: module.lessons && module.lessons.length > 0 ? module.lessons.map(lesson => ({
          lessonId: lesson._id,
          completed: false,
          videoCompleted: false,
          quizCompleted: false,
          exerciseCompleted: false,
          quizScore: 0, // Add default quiz score
          timeSpent: 0  // Add default time spent
        })) : []
      }));
    } else {
      // Default empty progress array for courses without modules
      enrollment.progress = [];
    }

    // Add to enrolledStudents in Course model if not already there
    if (!alreadyEnrolledInCourse) {
      // Initialize progress structure in the course model
      const progressData = {
        student: userId,
        enrolledAt: new Date(),
        progressPercentage: 0,
        progress: course.modules && course.modules.length > 0 ? course.modules.map(module => ({
          moduleId: module._id,
          completed: false,
          lessons: module.lessons && module.lessons.length > 0 ? module.lessons.map(lesson => ({
            lessonId: lesson._id,
            completed: false,
            quizScore: 0,
            timeSpent: 0
          })) : []
        })) : []
      };

      // Initialize enrolledStudents array if it doesn't exist
      if (!course.enrolledStudents) {
        course.enrolledStudents = [];
      }
      
      course.enrolledStudents.push(progressData);
      
      // Increment enrolledCount
      course.enrolledCount = (course.enrolledCount || 0) + 1;
      
      await course.save();
    }

    await enrollment.save();
    
    // Send a more detailed response with enrollment information
    res.status(201).json({ 
      message: 'Successfully enrolled in the course', 
      enrollment: {
        _id: enrollment._id,
        course: courseId,
        user: userId,
        progressPercentage: enrollment.progressPercentage,
        createdAt: enrollment.createdAt
      },
      redirectTo: `/course-dashboard/${courseId}`
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all enrollments for the current user
exports.getMyEnrollments = async (req, res) => {
  try {
    // Use either id or _id depending on what's available
    const userId = req.user.id || req.user._id;
    
    console.log('Fetching enrollments for user:', userId);
    
    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          model: 'User',
          select: 'name'
        }
      });
    
    console.log(`Found ${enrollments.length} enrollments`);
      
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
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
    const { progress, completedLessons, moduleId, lessonId } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Ensure the user owns the enrollment
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // Update the overall progress percentage
    if (progress !== undefined) {
      enrollment.progressPercentage = progress;
    }
    
    // Legacy support for completedLessons array
    if (completedLessons) {
      enrollment.completedLessons = completedLessons;
    }
    
    // If moduleId and lessonId are provided, update specific lesson progress
    if (moduleId && lessonId) {
      // Initialize progress array if it doesn't exist
      if (!enrollment.progress) {
        enrollment.progress = [];
      }
      
      let moduleProgress = enrollment.progress.find(p => 
        p.moduleId && p.moduleId.toString() === moduleId.toString()
      );
      
      if (!moduleProgress) {
        enrollment.progress.push({
          moduleId,
          completed: false,
          lessons: []
        });
        moduleProgress = enrollment.progress[enrollment.progress.length - 1];
      }
      
      // Initialize lessons array if it doesn't exist
      if (!moduleProgress.lessons) {
        moduleProgress.lessons = [];
      }
      
      let lessonProgress = moduleProgress.lessons.find(l => 
        l.lessonId && l.lessonId.toString() === lessonId.toString()
      );
      
      if (!lessonProgress) {
        moduleProgress.lessons.push({
          lessonId,
          completed: true,
          videoCompleted: true,
          completedAt: new Date()
        });
      } else {
        lessonProgress.completed = true;
        lessonProgress.completedAt = new Date();
      }
    }
    
    // Set completion date if course is 100% complete
    if (progress === 100 && !enrollment.completionDate) {
      enrollment.completionDate = new Date();
    }

    // Update last accessed timestamp
    enrollment.lastAccessedAt = new Date();

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
    
    const isEnrolled = !!(enrollmentRecord || (course && course.enrolledStudents && course.enrolledStudents.some(
      s => s.student && s.student.toString() === userId
    )));
    
    if (isEnrolled) {
      // If enrolled in Course model but not in Enrollment model, create the enrollment record
      if (!enrollmentRecord && course) {
        const newEnrollment = new Enrollment({
          user: userId,
          course: courseId
        });
        
        // Initialize progress tracking if the course has modules
        if (course.modules && course.modules.length > 0) {
          newEnrollment.progress = course.modules.map(module => ({
            moduleId: module._id,
            completed: false,
            lessons: module.lessons.map(lesson => ({
              lessonId: lesson._id,
              completed: false,
              videoCompleted: false,
              quizCompleted: false,
              exerciseCompleted: false
            }))
          }));
        }
        
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
