// routes/courseRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const courseController = require('../controllers/courseController');

const router = express.Router();

/**
 * CREATE a course (admins only)
 * Body: { title, description, modules:[{title, content}], ... }
 * Instructor will be set from logged-in admin user.
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instructor: req.user._id
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET all courses (public)
 */
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name email');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET a single course by ID (public)
 */
router.get('/:id', courseController.getCourseById);

/**
 * Get MY enrolled courses (students)
 */
router.get('/my/courses', protect, async (req, res) => {
  try {
    const courses = await Course.find({
      'enrolledStudents.student': req.user._id
    }).populate('instructor', 'name email');

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ENROLL in a course (students)
 */
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Initialize enrolledStudents if it doesn't exist
    if (!course.enrolledStudents) {
      course.enrolledStudents = [];
    }

    const alreadyEnrolled = course.enrolledStudents.some(
      (s) => s && s.student && s.student.toString() === req.user._id.toString()
    );
    
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create progress structure
    const studentProgress = {
      student: req.user._id,
      enrolledAt: new Date(),
      progressPercentage: 0
    };

    // Initialize progress tracking if course has modules
    if (course.modules && course.modules.length > 0) {
      studentProgress.progress = course.modules.map(module => ({
        moduleId: module._id,
        completed: false,
        lessons: module.lessons && module.lessons.length > 0 ? 
          module.lessons.map(lesson => ({
            lessonId: lesson._id,
            completed: false
          })) : []
      }));
    }

    course.enrolledStudents.push(studentProgress);
    await course.save();

    // Create enrollment record in Enrollment collection
    const Enrollment = require('../models/Enrollment');
    const enrollment = new Enrollment({
      user: req.user._id,
      course: course._id,
      progress: studentProgress.progress || []
    });
    await enrollment.save();

    res.json({ message: 'Enrolled successfully', courseId: course._id, enrollment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * MARK a module as completed (students)
 * POST /:courseId/modules/:moduleIndex/complete
 */
router.post('/:courseId/modules/:moduleIndex/complete', protect, async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const idx = Number(moduleIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= course.modules.length) {
      return res.status(400).json({ error: 'Invalid module index' });
    }

    // Update in Course model
    let studentRecord = course.enrolledStudents.find(
      (s) => s.student.toString() === userId.toString()
    );
    
    if (!studentRecord) {
      // If not found in Course model, add them
      studentRecord = { student: userId, progress: [] };
      course.enrolledStudents.push(studentRecord);
    }

    // Ensure progress array exists
    if (!Array.isArray(studentRecord.progress)) studentRecord.progress = [];

    // Idempotent: update if exists, else push new
    const existing = studentRecord.progress.find((p) => p.moduleId === idx);
    if (existing) {
      existing.completed = true;
      existing.completedAt = new Date();
    } else {
      studentRecord.progress.push({
        moduleId: idx,
        completed: true,
        completedAt: new Date()
      });
    }

    // Calculate new progress percentage
    const totalModules = course.modules.length;
    const completedModules = studentRecord.progress.filter(p => p.completed).length;
    const percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    
    // Update progressPercentage in the Course model
    studentRecord.progressPercentage = percentage;

    // Update in Enrollment model
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    
    if (enrollment) {
      // Update progress percentage
      enrollment.progressPercentage = percentage;
      
      // Ensure progress array exists
      if (!Array.isArray(enrollment.progress)) enrollment.progress = [];
      
      // Update or add module progress
      const moduleInProgress = enrollment.progress.find(p => 
        p.moduleId && p.moduleId.toString() === course.modules[idx]._id.toString()
      );
      
      if (moduleInProgress) {
        moduleInProgress.completed = true;
        moduleInProgress.completedAt = new Date();
      } else {
        enrollment.progress.push({
          moduleId: course.modules[idx]._id,
          completed: true,
          completedAt: new Date(),
          lessons: []
        });
      }
      
      // Add to completedLessons array for backward compatibility
      if (!Array.isArray(enrollment.completedLessons)) enrollment.completedLessons = [];
      
      // Add lesson IDs from the completed module to completedLessons
      course.modules[idx].lessons.forEach(lesson => {
        const lessonIdStr = lesson._id.toString();
        if (!enrollment.completedLessons.includes(lessonIdStr)) {
          enrollment.completedLessons.push(lessonIdStr);
        }
      });
      
      await enrollment.save();
    } else {
      // Create new enrollment if it doesn't exist
      await Enrollment.create({
        user: userId,
        course: courseId,
        progressPercentage: percentage,
        progress: [{
          moduleId: course.modules[idx]._id,
          completed: true,
          completedAt: new Date(),
          lessons: []
        }],
        completedLessons: course.modules[idx].lessons.map(lesson => lesson._id.toString())
      });
    }

    await course.save();
    
    res.json({ 
      message: 'Module marked as completed', 
      progress: studentRecord.progress,
      percentage,
      courseProgress: percentage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET progress (students)
 * Returns totals + details from embedded progress
 */
router.get('/:courseId/progress', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    
    // Get both models to ensure we have the most accurate data
    const Enrollment = require('../models/Enrollment');
    const [enrollment, course] = await Promise.all([
      Enrollment.findOne({ user: userId, course: courseId }),
      Course.findById(courseId)
    ]);
    
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // Find enrollment record in Course model
    const courseEnrollment = course.enrolledStudents && Array.isArray(course.enrolledStudents) ? 
      course.enrolledStudents.find(
        s => s.student && s.student.toString() === userId.toString()
      ) : null;
    
    // No enrollment in either model - create one
    if (!enrollment && !courseEnrollment) {
      const newEnrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        progress: 0
      });
      
      // Initialize enrolledStudents array if it doesn't exist
      if (!course.enrolledStudents) {
        course.enrolledStudents = [];
      }
      
      // Add to course.enrolledStudents too
      course.enrolledStudents.push({
        student: userId,
        progress: []
      });
      
      await course.save();
      
      return res.json({
        course: course.title,
        totalModules: course.modules.length,
        completedModules: 0,
        percentage: 0,
        progressDetails: []
      });
    }
    
    // Calculate progress based on course enrolledStudents
    let percentage = 0;
    let progressDetails = [];
    let completedModules = 0;
    const totalModules = course.modules.length;
    
    if (courseEnrollment && Array.isArray(courseEnrollment.progress)) {
      progressDetails = courseEnrollment.progress;
      completedModules = courseEnrollment.progress.filter(p => p.completed).length;
      percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    } else if (enrollment) {
      // If no course enrollment progress, use the Enrollment model's data
      percentage = enrollment.progressPercentage || 0;
      progressDetails = enrollment.progress || [];
      completedModules = enrollment.progress ? enrollment.progress.filter(p => p.completed).length : 0;
    }
    
    // If Enrollment model has progress but Course model doesn't (or is different), sync them
    if (enrollment && (!courseEnrollment || percentage !== enrollment.progressPercentage)) {
      // If Enrollment has higher progress, use that
      if (enrollment.progressPercentage > percentage) {
        percentage = enrollment.progressPercentage;
        // Update courseEnrollment if needed
        if (courseEnrollment) {
          await Course.updateOne(
            { _id: courseId, "enrolledStudents.student": userId },
            { $set: { "enrolledStudents.$.progressPercentage": percentage }}
          );
        } else if (course.enrolledStudents) {
          // Create a new enrolledStudent record if it doesn't exist
          course.enrolledStudents.push({
            student: userId,
            progressPercentage: percentage,
            progress: []
          });
          await course.save();
        }
      } 
      // If Course model has higher progress, update Enrollment
      else if (percentage > enrollment.progressPercentage) {
        await Enrollment.updateOne(
          { user: userId, course: courseId },
          { $set: { progressPercentage: percentage }}
        );
      }
    }
    
    // Get completed lessons from Enrollment model
    let completedLessons = [];
    if (enrollment && enrollment.completedLessons) {
      completedLessons = enrollment.completedLessons;
    } else if (enrollment && enrollment.progress) {
      // Extract from progress structure if available
      completedLessons = enrollment.progress.reduce((acc, module) => {
        const lessonIds = module.lessons
          .filter(lesson => lesson.completed)
          .map(lesson => lesson.lessonId);
        return [...acc, ...lessonIds];
      }, []);
    }
    
    res.json({
      course: course.title,
      totalModules,
      completedModules,
      percentage,
      progressDetails,
      completedLessons
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADD a quiz to a module (admins only)
 * Body: { question, options: [String], correctAnswer: Number }
 */
router.post('/:courseId/modules/:moduleIndex/quiz', protect, admin, async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const { question, options, correctAnswer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const idx = Number(moduleIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= course.modules.length) {
      return res.status(400).json({ error: 'Invalid module index' });
    }

    if (!Array.isArray(options) || typeof correctAnswer !== 'number') {
      return res.status(400).json({ error: 'Invalid quiz payload' });
    }

    if (!Array.isArray(course.modules[idx].quiz)) course.modules[idx].quiz = [];
    course.modules[idx].quiz.push({ question, options, correctAnswer });

    await course.save();
    res.json({ message: 'Quiz added successfully', module: course.modules[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ATTEMPT quiz (students)
 * Body: { answers: [Number] }
 */
router.post('/:courseId/modules/:moduleIndex/quiz/attempt', protect, async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const idx = Number(moduleIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= course.modules.length) {
      return res.status(400).json({ error: 'Invalid module index' });
    }

    const studentRecord = course.enrolledStudents.find(
      (s) => s.student.toString() === req.user._id.toString()
    );
    if (!studentRecord) return res.status(400).json({ error: 'Not enrolled in this course' });

    const quiz = course.modules[idx].quiz || [];
    if (quiz.length === 0) return res.status(400).json({ error: 'No quiz found in this module' });
    if (!Array.isArray(answers) || answers.length !== quiz.length) {
      return res.status(400).json({ error: 'Answers array length must match number of questions' });
    }

    let score = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    if (!Array.isArray(studentRecord.quizResults)) studentRecord.quizResults = [];
    studentRecord.quizResults.push({
      moduleId: idx,
      score,
      answers,
      attemptedAt: new Date()
    });

    await course.save();
    res.json({ message: 'Quiz submitted', score, total: quiz.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * COMPLETE course & issue certificate (students)
 */
router.post('/:courseId/complete', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const studentRecord = course.enrolledStudents.find(
      (s) => s.student.toString() === req.user._id.toString()
    );
    if (!studentRecord) return res.status(400).json({ error: 'Not enrolled in this course' });

    const totalModules = course.modules.length;
    const completedModules = (studentRecord.progress || []).filter(p => p.completed).length;

    if (completedModules < totalModules) {
      return res.status(400).json({ error: 'Complete all modules before getting certificate' });
    }

    studentRecord.completedAt = new Date();
    studentRecord.certificate = {
      issued: true,
      issuedAt: new Date(),
      certificateId: `CERT-${courseId}-${req.user._id}`
    };

    await course.save();
    res.json({ message: 'Course completed! Certificate issued', certificate: studentRecord.certificate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * VIEW certificate (students)
 */
router.get('/:courseId/certificate', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const studentRecord = course.enrolledStudents.find(
      (s) => s.student.toString() === req.user._id.toString()
    );

    if (!studentRecord || !studentRecord.certificate || !studentRecord.certificate.issued) {
      return res.status(400).json({ error: 'No certificate issued' });
    }

    res.json({
      certificateId: studentRecord.certificate.certificateId,
      student: req.user.name,
      course: course.title,
      instructor: course.instructor?.name || 'Instructor',
      issuedAt: studentRecord.certificate.issuedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE a course (admins only)
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const updated = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ error: 'Course not found' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE a course (admins only)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Course not found' });

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * READ single course (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(id)
      .populate('instructor', 'name email')
      .select('+modules'); // Explicitly include modules
      
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Initialize modules as an empty array if it doesn't exist
    if (!course.modules) {
      course.modules = [];
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
