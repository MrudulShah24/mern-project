const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const mongoose = require('mongoose');

// Get overall enrollment analytics (admin only)
exports.getEnrollmentAnalytics = async (req, res) => {
  try {
    const enrollments = await Enrollment.find().populate('course');
    
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.progressPercentage === 100).length;
    const inProgress = enrollments.filter(e => e.progressPercentage > 0 && e.progressPercentage < 100).length;
    const active = total - completed; // Enrolled but not completed
    
    res.json({
      total,
      active,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  } catch (error) {
    console.error('Enrollment analytics error:', error);
    res.status(500).json({ error: 'Failed to get enrollment analytics: ' + error.message });
  }
};

// Get analytics for a specific course
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Course ID format' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
    }

    // Get course details
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get course enrollments
    const enrollments = await Enrollment.find({
      course: id,
      createdAt: { $gte: startDate }
    }).populate('user', 'email region');

    // Calculate analytics
    const totalEnrollments = enrollments.length;
    const completedStudents = enrollments.filter(e => e.progressPercentage === 100).length;
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedStudents / totalEnrollments) * 100) 
      : 0;

    // Calculate average completion time in days
    const completionTimes = enrollments
      .filter(e => e.progressPercentage === 100 && e.completionDate)
      .map(e => {
        const start = new Date(e.createdAt);
        const end = new Date(e.completionDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      });
    
    const averageCompletionDays = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    // Collect all quizzes in this course
    const quizzes = [];
    if (course.modules) {
      course.modules.forEach(module => {
        if (module.quiz && module.quiz.questions && module.quiz.questions.length > 0) {
          quizzes.push({
            id: module.quiz._id.toString(),
            title: module.quiz.title || `${module.title} Quiz`,
            type: 'module',
            moduleId: module._id.toString()
          });
        }
        if (module.lessons) {
          module.lessons.forEach(lesson => {
            if (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0) {
              quizzes.push({
                id: lesson.quiz._id.toString(),
                title: lesson.quiz.title || `${lesson.title} Quiz`,
                type: 'lesson',
                moduleId: module._id.toString(),
                lessonId: lesson._id.toString()
              });
            }
          });
        }
      });
    }
    if (course.finalExam && course.finalExam.questions && course.finalExam.questions.length > 0) {
      quizzes.push({
        id: course.finalExam._id.toString(),
        title: course.finalExam.title || 'Final Exam',
        type: 'final'
      });
    }

    // Get quiz statistics (average score per quiz)
    const quizStats = quizzes.map(q => {
      const scores = [];
      enrollments.forEach(e => {
        if (q.type === 'module' || q.type === 'final') {
          const result = e.quizResults?.find(r => r.quizId && r.quizId.toString() === q.id);
          if (result) scores.push(result.score);
        } else if (q.type === 'lesson') {
          const moduleProgress = e.progress?.find(m => m.moduleId && m.moduleId.toString() === q.moduleId);
          const lessonProgress = moduleProgress?.lessons?.find(l => l.lessonId && l.lessonId.toString() === q.lessonId);
          if (lessonProgress && lessonProgress.quizCompleted) {
            scores.push(lessonProgress.quizScore || 0);
          }
        }
      });
      
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
        
      return {
        name: q.title,
        value: avgScore
      };
    });

    // Get student engagement per day (using lastAccessedAt)
    const engagementData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const activeStudents = enrollments.filter(e => 
        e.lastAccessedAt >= date && e.lastAccessedAt < nextDate
      ).length;

      return {
        date: date.toLocaleDateString(),
        activeStudents
      };
    }).reverse();

    // Get student demographics by region (mocked from email domains to avoid undefined region)
    const demographics = enrollments.reduce((acc, curr) => {
      let region = 'Global';
      if (curr.user && curr.user.email) {
        if (curr.user.email.endsWith('.in')) region = 'India';
        else if (curr.user.email.endsWith('.uk')) region = 'United Kingdom';
        else if (curr.user.email.endsWith('.edu')) region = 'Academia';
        else region = 'United States';
      }
      const existing = acc.find(d => d.category === region);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ category: region, value: 1 });
      }
      return acc;
    }, []);

    res.json({
      totalEnrollments,
      completionRate,
      averageRating: course.rating || 0,
      averageCompletionDays,
      quizStats,
      studentEngagement: engagementData,
      demographics
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to get course analytics: ' + err.message });
  }
};

// Get progress statistics for a course
exports.getProgressStats = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    const enrollments = await Enrollment.find({ course: id });

    const moduleStats = course.modules.map(module => {
      const completedByStudents = enrollments.filter(e => {
        const modProgress = e.progress?.find(p => p.moduleId && p.moduleId.toString() === module._id.toString());
        return modProgress && modProgress.completed;
      }).length;

      return {
        module: module.title,
        completionRate: enrollments.length > 0
          ? Math.round((completedByStudents / enrollments.length) * 100)
          : 0
      };
    });

    res.json(moduleStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get progress statistics: ' + err.message });
  }
};

// Get quiz statistics for a course
exports.getQuizStats = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollments = await Enrollment.find({ course: id });
    
    const scoreRanges = [
      { name: '90-100%', value: 0 },
      { name: '70-89%', value: 0 },
      { name: '50-69%', value: 0 },
      { name: '0-49%', value: 0 }
    ];

    enrollments.forEach(e => {
      // Add scores from module/final quizzes
      e.quizResults?.forEach(result => {
        const score = result.score;
        if (score >= 90) scoreRanges[0].value++;
        else if (score >= 70) scoreRanges[1].value++;
        else if (score >= 50) scoreRanges[2].value++;
        else scoreRanges[3].value++;
      });
      
      // Add scores from lesson quizzes
      e.progress?.forEach(moduleProgress => {
        moduleProgress.lessons?.forEach(lesson => {
          if (lesson.quizCompleted) {
            const score = lesson.quizScore || 0;
            if (score >= 90) scoreRanges[0].value++;
            else if (score >= 70) scoreRanges[1].value++;
            else if (score >= 50) scoreRanges[2].value++;
            else scoreRanges[3].value++;
          }
        });
      });
    });

    res.json(scoreRanges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get quiz statistics: ' + err.message });
  }
};
