// routes/courseRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const courseController = require('../controllers/courseController');

const validate = require('../middleware/validationMiddleware');
const { courseSchema } = require('../utils/schemas');
const { tokenizeAndScore, callGemini } = require('../utils/aiAssistant');

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

    // Get user enrollments so we can indicate courses they already joined
    const Enrollment = require('../models/Enrollment');
    const userEnrollments = await Enrollment.find({ user: userId }).select('course');
    const enrolledCourseIds = userEnrollments.map(e => e.course.toString());

    // Fetch all published courses to use as context
    const allCourses = await Course.find({ status: 'published' }).populate('instructor', 'name');

    const lowercaseQuery = query.toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY;

    // Check if the query contains a specific course ID (24-character hexadecimal)
    const idMatch = query.match(/[a-f\d]{24}/i);
    let targetCourse = null;
    
    if (idMatch) {
      targetCourse = await Course.findById(idMatch[0]).populate('instructor', 'name');
    }

    // If no ID match, check if query contains the title of any published course
    if (!targetCourse) {
      for (const c of allCourses) {
        if (lowercaseQuery.includes(c.title.toLowerCase())) {
          targetCourse = c;
          break;
        }
      }
    }

    // If the user is asking about a specific course (matched by ID or title)
    if (targetCourse) {
      // 1. Try Gemini
      if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your_gemini_api_key_here')) {
        const modulesContext = (targetCourse.modules || []).map((m, mIdx) => 
          `- Module ${mIdx + 1}: "${m.title}"\n  Lessons:\n${(m.lessons || []).map((l, lIdx) => `    * Lesson ${lIdx + 1}: "${l.title}"`).join('\n')}`
        ).join('\n\n');

        const systemInstruction = 
          `You are the EduForge AI Learning Assistant. The user is asking about a specific course: "${targetCourse.title}" (Category: "${targetCourse.category}").\n` +
          `Here is the course syllabus:\n${modulesContext}\n\n` +
          `Description: "${targetCourse.description}"\n\n` +
          `Guidelines:\n` +
          `- Explain what is covered in this specific course, its modules, or duration.\n` +
          `- If they ask to explain it, provide a nice overview of the course syllabus.\n` +
          `- Keep your response under 150 words and use markdown.\n` +
          `- Add *(You are already enrolled)* if the user has already enrolled (Enrolled: ${enrolledCourseIds.includes(targetCourse._id.toString())}).`;

        const reply = await callGemini(query, systemInstruction);
        if (reply) {
          return res.json({ reply });
        }
      }

      // 2. Fallback to Local NLP Course Info
      console.log(`Using Local NLP to explain course: ${targetCourse.title}`);
      const moduleList = (targetCourse.modules || []).map((m, idx) => `${idx + 1}. **${m.title}** (${m.lessons ? m.lessons.length : 0} lessons)`).join('\n');
      const isEnrolled = enrolledCourseIds.includes(targetCourse._id.toString());
      const enrollText = isEnrolled ? ' *(You are enrolled!)*' : '';
      
      const responseText = `Here is what is covered in **${targetCourse.title}**:${enrollText}\n\n` +
        `**Category**: ${targetCourse.category || 'General'} | **Level**: ${targetCourse.level || 'Beginner'}\n` +
        `**Description**: ${targetCourse.description}\n\n` +
        `**Syllabus**:\n${moduleList || 'No modules listed.'}\n\n` +
        (isEnrolled ? `You are already enrolled! You can access it from your dashboard.` : `You can search for this course in the **Explore Library** tab to enroll and start learning!`);

      return res.json({ reply: responseText });
    }

    // 1. Try Live Gemini LLM Mode if key exists
    if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your_gemini_api_key_here')) {
      const coursesContext = allCourses.map(c => 
        `- Course Title: "${c.title}"\n  ID: "${c._id}"\n  Category: "${c.category}"\n  Level: "${c.level}"\n  Instructor: "${c.instructor ? c.instructor.name : 'Mentor'}"\n  Description: "${c.description}"\n  Tags: [${(c.tags || []).join(', ')}]`
      ).join('\n\n');

      const systemInstruction = 
        `You are the EduForge AI Learning Assistant. You help students find the best courses from our catalog.\n` +
        `Here is our current course catalog:\n\n${coursesContext}\n\n` +
        `Guidelines:\n` +
        `- Evaluate the user's query and suggest the most relevant courses.\n` +
        `- Explain briefly why each suggested course is a good fit.\n` +
        `- If they are asking questions about what topics they should learn, answer them and link it back to our courses.\n` +
        `- Be friendly, conversational, and direct. Keep your answer under 150 words.\n` +
        `- Use markdown list formatting for courses. Add *(You are already enrolled)* if the user has already enrolled (Enrolled IDs: ${enrolledCourseIds.join(', ')}).`;

      const reply = await callGemini(query, systemInstruction);
      if (reply) {
        return res.json({ reply });
      }
    }

    // 2. Fallback to Local Intelligent NLP Mode
    console.log('Using Local NLP matching for global course assistant...');
    
    // Rank all courses based on relevance score
    const scoredCourses = allCourses.map(course => {
      const docText = `${course.description} ${course.category || ''}`;
      const score = tokenizeAndScore(query, docText, course.title, course.tags);
      return { course, score };
    });

    // Filter courses with score > 0 and sort desc
    const matches = scoredCourses
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    let finalRecommendations = [];
    let isFilteredByQuery = false;

    if (matches.length > 0) {
      finalRecommendations = matches.slice(0, 3).map(item => item.course);
      isFilteredByQuery = true;
    } else {
      // If no matches, return trending courses the user is not yet enrolled in
      finalRecommendations = allCourses
        .filter(c => !enrolledCourseIds.includes(c._id.toString()))
        .slice(0, 3);
      if (finalRecommendations.length === 0) {
        finalRecommendations = allCourses.slice(0, 3);
      }
    }

    const coursesList = finalRecommendations.map(c => {
      const isEnrolled = enrolledCourseIds.includes(c._id.toString());
      const enrollText = isEnrolled ? ' *(You are enrolled!)*' : '';
      return `• **${c.title}**${enrollText}\n  *Category: ${c.category || 'General'} | Level: ${c.level || 'Beginner'}*`;
    }).join('\n');

    let responseText = '';
    if (isFilteredByQuery) {
      responseText = `I analyzed our library catalog and found some great matches for your query:\n\n${coursesList}\n\nYou can head over to the **Explore Library** tab to sign up and start learning right away!`;
    } else {
      responseText = `I couldn't find any courses exactly matching your search query. However, here are some popular learning tracks available on our platform that you might like:\n\n${coursesList}\n\nWhat topics are you looking to study? Tell me, and I will recommend the best fit for your goals!`;
    }

    return res.json({ reply: responseText });
  } catch (err) {
    console.error('Error in global ask-assistant:', err);
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
    const lowercaseQuery = query.toLowerCase();

    // 1. Try Live Gemini LLM Mode if key exists
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your_gemini_api_key_here')) {
      const modulesContext = modules.map((m, mIdx) => 
        `- Module ${mIdx + 1}: "${m.title}"\n  Lessons:\n${(m.lessons || []).map((l, lIdx) => `    * Lesson ${lIdx + 1}: "${l.title}"`).join('\n')}`
      ).join('\n\n');

      const systemInstruction = 
        `You are EduForge Copilot, an AI Study Buddy helping a student who is currently taking the course "${courseTitle}" (Category: "${courseCategory}").\n\n` +
        `Here is the course syllabus:\n${modulesContext}\n\n` +
        `The student's current progress is at ${enrollment ? enrollment.progressPercentage : 0}%.\n\n` +
        `Guidelines:\n` +
        `- Answer their questions about the course material, syllabus, progress, or certificates accurately using the context.\n` +
        `- If they ask a technical question, provide clear, easy-to-understand explanations and include code examples in markdown syntax where appropriate.\n` +
        `- Be friendly, encouraging, and supportive. Keep your answer focused and concise (under 200 words).`;

      const reply = await callGemini(query, systemInstruction);
      if (reply) {
        return res.json({ reply, timestamp: new Date() });
      }
    }

    // 2. Fallback to Local Intelligent NLP Mode
    console.log('Using Local NLP matching for course-specific study buddy...');
    let responseText = '';

    // Check query for specific intents first (progress, syllabus, certificates, recommendations of other courses)
    if (lowercaseQuery.includes('progress') || lowercaseQuery.includes('complete') || lowercaseQuery.includes('how far')) {
      if (enrollment) {
        const completedCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
        responseText = `You are currently enrolled in **${courseTitle}**. Your progress is at **${enrollment.progressPercentage}%**. You have completed **${completedCount}** lessons so far. Keep pushing forward! You can see your full stats in the side panel.`;
      } else {
        responseText = `I couldn't find an active enrollment for you in **${courseTitle}**. Please make sure you are enrolled!`;
      }
    }
    else if (lowercaseQuery.includes('modules') || lowercaseQuery.includes('syllabus') || lowercaseQuery.includes('chapters') || lowercaseQuery.includes('lessons')) {
      const moduleList = modules.map((m, idx) => `${idx + 1}. **${m.title}** (${m.lessons ? m.lessons.length : 0} lessons)`).join('\n');
      responseText = `Here is the course syllabus for **${courseTitle}**:\n\n${moduleList || 'No modules available yet.'}\n\nWhich module would you like to dive into?`;
    }
    else if (lowercaseQuery.includes('certificate') || lowercaseQuery.includes('verify')) {
      if (enrollment && enrollment.progressPercentage === 100) {
        responseText = `Congratulations! You have completed 100% of the course. You are eligible to generate your certificate. Click on the **Claim Certificate** button in the dashboard to generate and download your PDF.`;
      } else {
        const remaining = enrollment ? (100 - enrollment.progressPercentage) : 100;
        responseText = `You are currently at **${enrollment ? enrollment.progressPercentage : 0}%** completion. You need to complete all modules and lessons (${remaining}% remaining) to unlock your certificate of completion!`;
      }
    }
    else if (lowercaseQuery.includes('recommend') || lowercaseQuery.includes('suggest') || lowercaseQuery.includes('other course') || lowercaseQuery.includes('another course') || lowercaseQuery.includes('what else')) {
      // Recommend other courses in the catalog
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
          _id: { $ne: courseId },
          status: 'published',
          $or: [
            { category: new RegExp(searchTopic, 'i') },
            { title: new RegExp(searchTopic, 'i') },
            { tags: new RegExp(searchTopic, 'i') }
          ]
        }).limit(3);
      } else {
        recommendedCourses = await Course.find({
          _id: { $ne: courseId },
          status: 'published'
        }).limit(3);
      }

      if (recommendedCourses.length > 0) {
        const coursesList = recommendedCourses.map(c => `• **${c.title}** (*Category: ${c.category || 'General'}*)`).join('\n');
        responseText = `Yes! We have some other great courses on our platform. Here are some recommendations you might like:\n\n${coursesList}\n\nYou can click on the **Explore Library** tab to enroll in them!`;
      } else {
        responseText = `Currently, we don't have other courses on that specific topic, but you can check out all our catalog by going to the **Explore Library** page!`;
      }
    }
    else {
      // Run NLP matching against syllabus modules and lessons to find relevant content
      let bestMatch = null;
      let highestScore = 0;

      modules.forEach((mod, mIdx) => {
        const modScore = tokenizeAndScore(lowercaseQuery, mod.description || '', mod.title);
        if (modScore > highestScore) {
          highestScore = modScore;
          bestMatch = { type: 'module', title: mod.title, index: mIdx + 1 };
        }

        if (mod.lessons) {
          mod.lessons.forEach((les, lIdx) => {
            const lesScore = tokenizeAndScore(lowercaseQuery, les.content || les.description || '', les.title);
            if (lesScore > highestScore) {
              highestScore = lesScore;
              bestMatch = { 
                type: 'lesson', 
                title: les.title, 
                moduleTitle: mod.title, 
                moduleIndex: mIdx + 1, 
                lessonIndex: lIdx + 1 
              };
            }
          });
        }
      });

      if (highestScore > 1.5 && bestMatch) {
        if (bestMatch.type === 'lesson') {
          responseText = `I searched this course's syllabus and found a relevant lesson that matches your query:\n` +
            `• **Lesson ${bestMatch.lessonIndex} - "${bestMatch.title}"** inside **Module ${bestMatch.moduleIndex} ("${bestMatch.moduleTitle}")**.\n\n` +
            `Please check out that lesson to find exactly what you are looking for! Let me know if you have any questions about its contents.`;
        } else {
          responseText = `I scanned the course syllabus and found a relevant module matching your query:\n` +
            `• **Module ${bestMatch.index} - "${bestMatch.title}"**.\n\n` +
            `This module covers concepts related to your query. You can click on this module in the sidebar checklist to begin reading its lessons!`;
        }
      } 
      // If no module/lesson overlap, return general category response with a code snippet
      else {
        if (courseCategory.toLowerCase().includes('data') || courseTitle.toLowerCase().includes('data') || courseTitle.toLowerCase().includes('python')) {
          responseText = `As your study buddy for **${courseTitle}**, I can help you with Python, pandas dataframes, data plots, or statistics.\n\nHere is a quick Python example for data manipulation:\n\n\`\`\`python\nimport pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.describe()) # summarizes numeric stats\n\`\`\`\n\nWhat specific part of this course can we review next?`;
        } else if (courseCategory.toLowerCase().includes('web') || courseTitle.toLowerCase().includes('javascript') || courseTitle.toLowerCase().includes('react')) {
          responseText = `As your study buddy for **${courseTitle}**, I'm ready to help you with JavaScript, React components, state/hooks, or REST APIs.\n\nHere is a simple React functional component template:\n\n\`\`\`javascript\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}\n\`\`\`\n\nIs there a specific lesson exercise or quiz question you need help with?`;
        } else {
          responseText = `Welcome! I am your AI Study Buddy for **${courseTitle}**. I can help you understand the topics covered, write practice exercises, explain difficult concepts, or prepare for the quizzes.\n\nWhat topic or module can we review together today?`;
        }
      }
    }

    res.json({
      reply: responseText,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error in course-specific ask-assistant:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
