// routes/courseRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const courseController = require('../controllers/courseController');

const validate = require('../middleware/validationMiddleware');
const { courseSchema } = require('../utils/schemas');

const router = express.Router();

/**
 * CREATE a course (admins only)
 * Body: { title, description, modules:[{title, content}], ... }
 * Instructor will be set from logged-in admin user.
 */
router.post('/', protect, admin, validate(courseSchema), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      tags,
      thumbnail,
      duration,
      level,
      learningObjectives,
      prerequisites,
      modules,
      certificateAvailable,
      status
    } = req.body;

    const course = new Course({
      title,
      description,
      price,
      category,
      tags,
      thumbnail,
      duration,
      level,
      learningObjectives,
      prerequisites,
      modules,
      certificateAvailable,
      status,
      instructor: req.user._id
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const { populateEnrolledCount } = require('../utils/courseHelper');

/**
 * GET all courses (public)
 */
router.get('/', courseController.getAllCourses);

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

    const dynamicCourses = await populateEnrolledCount(courses);
    res.json(dynamicCourses);
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
    
    if (enrollment) {
      // Use the Enrollment model's data as the primary detailed progress source of truth
      percentage = enrollment.progressPercentage || 0;
      progressDetails = enrollment.progress || [];
      completedModules = enrollment.progress ? enrollment.progress.filter(p => p.completed).length : 0;
    } else if (courseEnrollment && Array.isArray(courseEnrollment.progress)) {
      progressDetails = courseEnrollment.progress;
      completedModules = courseEnrollment.progress.filter(p => p.completed).length;
      percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
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

    let studentRecord = course.enrolledStudents.find(
      (s) => s.student && s.student.toString() === req.user._id.toString()
    );
    if (!studentRecord) {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
      if (!enrollment) return res.status(400).json({ error: 'Not enrolled in this course' });
      
      studentRecord = {
        student: req.user._id,
        enrolledAt: enrollment.createdAt || new Date(),
        progressPercentage: enrollment.progressPercentage,
        progress: []
      };
      course.enrolledStudents.push(studentRecord);
      await course.save();
    }

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
router.put('/:id', protect, admin, validate(courseSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Build update object with allowed properties only
    const allowedUpdates = {};
    const whitelist = [
      'title',
      'description',
      'price',
      'category',
      'tags',
      'thumbnail',
      'duration',
      'level',
      'learningObjectives',
      'prerequisites',
      'modules',
      'certificateAvailable',
      'status'
    ];

    whitelist.forEach(field => {
      if (req.body[field] !== undefined) {
        allowedUpdates[field] = req.body[field];
      }
    });

    const updated = await Course.findByIdAndUpdate(id, allowedUpdates, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ error: 'Course not found' });

    const dynamicUpdated = await populateEnrolledCount(updated);
    res.json(dynamicUpdated);
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
 * Global AI Learning Assistant (students)
 * POST /ask-assistant
 * Body: { query }
 */
router.post('/ask-assistant', protect, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const lowercaseQuery = query.toLowerCase();
    let responseText = '';

    // Get user enrollments so we can indicate courses they already joined
    const Enrollment = require('../models/Enrollment');
    const userEnrollments = await Enrollment.find({ user: userId }).select('course');
    const enrolledCourseIds = userEnrollments.map(e => e.course.toString());

    // Determine category or search terms from query
    let searchTopic = '';
    if (lowercaseQuery.includes('python') || lowercaseQuery.includes('data')) {
      searchTopic = 'Data';
    } else if (lowercaseQuery.includes('web') || lowercaseQuery.includes('react') || lowercaseQuery.includes('javascript') || lowercaseQuery.includes('node') || lowercaseQuery.includes('html') || lowercaseQuery.includes('vue')) {
      searchTopic = 'Web';
    } else if (lowercaseQuery.includes('design') || lowercaseQuery.includes('ui') || lowercaseQuery.includes('ux') || lowercaseQuery.includes('figma')) {
      searchTopic = 'Design';
    } else if (lowercaseQuery.includes('security') || lowercaseQuery.includes('cissp') || lowercaseQuery.includes('cyber')) {
      searchTopic = 'Security';
    } else if (lowercaseQuery.includes('android') || lowercaseQuery.includes('kotlin') || lowercaseQuery.includes('mobile')) {
      searchTopic = 'Android';
    }

    if (!searchTopic) {
      // Try to find any word > 3 characters that is not a common stopword
      const words = lowercaseQuery.split(/\s+/);
      const stopwords = ['what', 'want', 'learn', 'show', 'find', 'some', 'course', 'courses', 'topic', 'about', 'need', 'there', 'have', 'your', 'website'];
      const candidates = words.filter(w => w.length > 3 && !stopwords.includes(w));
      if (candidates.length > 0) {
        searchTopic = candidates[0].replace(/[^a-zA-Z]/g, ''); // strip punctuation
      }
    }

    let recommendedCourses = [];
    if (searchTopic) {
      recommendedCourses = await Course.find({
        status: 'published',
        $or: [
          { category: new RegExp(searchTopic, 'i') },
          { title: new RegExp(searchTopic, 'i') },
          { tags: new RegExp(searchTopic, 'i') }
        ]
      }).limit(5);
    } else {
      // Return a general mix of published courses the user is not enrolled in
      recommendedCourses = await Course.find({
        status: 'published',
        _id: { $nin: enrolledCourseIds }
      }).limit(3);

      if (recommendedCourses.length < 3) {
        recommendedCourses = await Course.find({ status: 'published' }).limit(3);
      }
    }

    if (recommendedCourses.length > 0) {
      const coursesList = recommendedCourses.map(c => {
        const isEnrolled = enrolledCourseIds.includes(c._id.toString());
        const enrollText = isEnrolled ? ' *(You are enrolled!)*' : '';
        return `• **${c.title}**${enrollText}\n  *Category: ${c.category || 'General'} | Level: ${c.level || 'Beginner'}*`;
      }).join('\n');

      if (searchTopic) {
        responseText = `Yes, we have some excellent courses matching **${searchTopic}**! Here are the top matches:\n\n${coursesList}\n\nYou can head over to the **Explore Library** tab to sign up and start learning right away!`;
      } else {
        responseText = `Here are some popular learning tracks available on our platform:\n\n${coursesList}\n\nWhat topics are you looking to study? Tell me, and I will recommend the best fit for your goals!`;
      }
    } else {
      responseText = `I couldn't find any courses matching "**${searchTopic || query}**" in our library right now. \n\nHowever, we are constantly adding new learning modules! Please check out the **Explore Library** page to see all of our active courses.`;
    }

    res.json({ reply: responseText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * AI Study Buddy Chatbot (students)
 * POST /:courseId/ask-assistant
 * Body: { query }
 */
router.post('/:courseId/ask-assistant', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { query } = req.body;
    const userId = req.user._id;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });

    // Build course context
    const courseTitle = course.title;
    const courseCategory = course.category || 'General';
    const modules = course.modules || [];

    // Let's create an intelligent, context-aware simulated AI response
    let responseText = '';
    const lowercaseQuery = query.toLowerCase();

    // 1. Check if user is asking about progress
    if (lowercaseQuery.includes('progress') || lowercaseQuery.includes('complete') || lowercaseQuery.includes('how far')) {
      if (enrollment) {
        const completedCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
        responseText = `You are currently enrolled in **${courseTitle}**. Your progress is at **${enrollment.progressPercentage}%**. You have completed **${completedCount}** lessons so far. Keep pushing forward! You can see your full stats in the side panel.`;
      } else {
        responseText = `I couldn't find an active enrollment for you in **${courseTitle}**. Please make sure you are enrolled!`;
      }
    }
    // 2. Check if user is asking for syllabus or modules
    else if (lowercaseQuery.includes('modules') || lowercaseQuery.includes('syllabus') || lowercaseQuery.includes('chapters') || lowercaseQuery.includes('lessons')) {
      const moduleList = modules.map((m, idx) => `${idx + 1}. **${m.title}** (${m.lessons ? m.lessons.length : 0} lessons)`).join('\n');
      responseText = `Here is the course syllabus for **${courseTitle}**:\n\n${moduleList || 'No modules available yet.'}\n\nWhich module would you like to dive into?`;
    }
    // 3. Check if user is asking for a code example
    else if (lowercaseQuery.includes('code') || lowercaseQuery.includes('example') || lowercaseQuery.includes('snippet') || lowercaseQuery.includes('write')) {
      if (courseCategory.toLowerCase().includes('data') || courseTitle.toLowerCase().includes('data') || courseTitle.toLowerCase().includes('python')) {
        responseText = `Here is a Python code example relating to data science and analytics:\n\n\`\`\`python\nimport pandas as pd\nimport numpy as np\n\n# Create a sample DataFrame\ndata = {\n    'Student': ['Alice', 'Bob', 'Charlie'],\n    'Score': [85, 92, 78]\n}\ndf = pd.DataFrame(data)\n\n# Calculate class average\naverage_score = df['Score'].mean()\nprint(f"Class average: {average_score:.2f}")\n\`\`\``;
      } else {
        responseText = `Here is a JavaScript example demonstrating async data fetching from a MERN API:\n\n\`\`\`javascript\nasync function fetchCourseProgress(courseId) {\n  try {\n    const response = await fetch(\`/api/courses/\${courseId}/progress\`);\n    const data = await response.json();\n    console.log("Progress:", data.percentage + "%");\n  } catch (error) {\n    console.error("Failed to load progress:", error);\n  }\n}\n\`\`\``;
      }
    }
    // 4. Check if user asks for certificate
    else if (lowercaseQuery.includes('certificate') || lowercaseQuery.includes('verify')) {
      if (enrollment && enrollment.progressPercentage === 100) {
        responseText = `Congratulations! You have completed 100% of the course. You are eligible to generate your certificate. Click on the **Claim Certificate** button in the dashboard to generate and download your PDF.`;
      } else {
        const remaining = enrollment ? (100 - enrollment.progressPercentage) : 100;
        responseText = `You are currently at **${enrollment ? enrollment.progressPercentage : 0}%** completion. You need to complete all modules and lessons (${remaining}% remaining) to unlock your certificate of completion!`;
      }
    }
    // 5. Check if user is asking for course recommendations / recommendations of other courses
    else if (lowercaseQuery.includes('recommend') || lowercaseQuery.includes('suggest') || lowercaseQuery.includes('other course') || lowercaseQuery.includes('find a course') || lowercaseQuery.includes('looking for a course') || lowercaseQuery.includes('another course') || lowercaseQuery.includes('what else') || lowercaseQuery.includes('learn python') || lowercaseQuery.includes('learn web') || lowercaseQuery.includes('learn design')) {
      let searchTopic = '';
      if (lowercaseQuery.includes('python') || lowercaseQuery.includes('data')) {
        searchTopic = 'Data';
      } else if (lowercaseQuery.includes('web') || lowercaseQuery.includes('react') || lowercaseQuery.includes('javascript') || lowercaseQuery.includes('node') || lowercaseQuery.includes('html')) {
        searchTopic = 'Web';
      } else if (lowercaseQuery.includes('design') || lowercaseQuery.includes('ui') || lowercaseQuery.includes('ux') || lowercaseQuery.includes('figma')) {
        searchTopic = 'Design';
      }

      let recommendedCourses = [];
      if (searchTopic) {
        recommendedCourses = await Course.find({
          _id: { $ne: courseId }, // don't recommend the current course
          status: 'published',
          $or: [
            { category: new RegExp(searchTopic, 'i') },
            { title: new RegExp(searchTopic, 'i') },
            { tags: new RegExp(searchTopic, 'i') }
          ]
        }).limit(3);
      } else {
        // Fallback to recommending some trending courses
        recommendedCourses = await Course.find({
          _id: { $ne: courseId },
          status: 'published'
        }).limit(3);
      }

      if (recommendedCourses.length > 0) {
        const coursesList = recommendedCourses.map(c => `• **${c.title}** (Instructor: ${c.instructor ? 'Instructor' : 'Mentor'}, Category: ${c.category || 'General'})`).join('\n');
        responseText = `Yes! We have some great courses on that topic in our library. Here are some recommendations you might like:\n\n${coursesList}\n\nYou can click on the **Explore Library** page in the navigation bar to enroll in them!`;
      } else {
        responseText = `Currently, we don't have other courses on that specific topic, but you can check out all our catalog by going to the **Explore Library** section!`;
      }
    }
    // 6. General intelligent response based on category
    else {
      if (courseCategory.toLowerCase().includes('data') || courseTitle.toLowerCase().includes('data')) {
        responseText = `As your study buddy for **${courseTitle}**, I can help you understand data visualization, data manipulation with libraries like Pandas, and key data science algorithms.\n\nCould you clarify if you'd like to talk about data analysis principles, plotting libraries, or help with a specific lesson quiz?`;
      } else if (courseCategory.toLowerCase().includes('web') || courseTitle.toLowerCase().includes('javascript') || courseTitle.toLowerCase().includes('react')) {
        responseText = `As your study buddy for **${courseTitle}**, I'm ready to help you with full-stack web development, MERN architecture (MongoDB, Express, React, Node.js), state management, or REST APIs.\n\nWould you like me to explain a concept from one of the modules or draft a code example?`;
      } else {
        responseText = `Welcome! I am your AI Study Buddy for **${courseTitle}** (${courseCategory}). I can help you understand the topics covered, write practice exercises, explain difficult concepts, or prepare for the quizzes.\n\nWhat topic or module can we review together today?`;
      }
    }

    res.json({
      reply: responseText,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
