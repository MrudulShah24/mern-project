// routes/courseRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

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

    const alreadyEnrolled = course.enrolledStudents.some(
      (s) => s.student.toString() === req.user._id.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    course.enrolledStudents.push({ student: req.user._id });
    await course.save();

    res.json({ message: 'Enrolled successfully', courseId: course._id });
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
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: userId, course: courseId },
      { 
        $set: { progress: percentage },
        $addToSet: { completedLessons: idx.toString() }
      },
      { new: true, upsert: true }
    );

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
    const courseEnrollment = course.enrolledStudents.find(
      s => s.student && s.student.toString() === userId.toString()
    );
    
    // No enrollment in either model - create one
    if (!enrollment && !courseEnrollment) {
      const newEnrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        progress: 0
      });
      
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
    }
    
    // If Enrollment model has progress but Course model doesn't (or is different), sync them
    if (enrollment && (!courseEnrollment || percentage !== enrollment.progress)) {
      // If Enrollment has higher progress, use that
      if (enrollment.progress > percentage) {
        percentage = enrollment.progress;
        // Update courseEnrollment if needed
        if (courseEnrollment) {
          await Course.updateOne(
            { _id: courseId, "enrolledStudents.student": userId },
            { $set: { "enrolledStudents.$.progressPercentage": percentage }}
          );
        }
      } 
      // If Course model has higher progress, update Enrollment
      else if (percentage > enrollment.progress) {
        await Enrollment.updateOne(
          { user: userId, course: courseId },
          { $set: { progress: percentage }}
        );
      }
    }
    
    res.json({
      course: course.title,
      totalModules,
      completedModules,
      percentage,
      progressDetails
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

    const course = await Course.findById(id).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
