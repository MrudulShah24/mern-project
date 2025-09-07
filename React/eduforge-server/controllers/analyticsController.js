const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

// Get analytics for a specific course
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe } = req.query;

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

    // Get course enrollments
    const enrollments = await Enrollment.find({
      course: id,
      createdAt: { $gte: startDate }
    }).populate('student');

    // Get course progress
    const progress = await Progress.find({
      course: id,
      updatedAt: { $gte: startDate }
    });

    // Calculate analytics
    const totalEnrollments = enrollments.length;
    const completedStudents = progress.filter(p => p.isCompleted).length;
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedStudents / totalEnrollments) * 100) 
      : 0;

    // Calculate average completion time in days
    const completionTimes = progress
      .filter(p => p.isCompleted)
      .map(p => {
        const start = new Date(p.createdAt);
        const end = new Date(p.completedAt);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      });
    
    const averageCompletionDays = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b) / completionTimes.length)
      : 0;

    // Get quiz statistics
    const course = await Course.findById(id);
    const quizStats = course.quizzes.map(quiz => {
      const attempts = progress.filter(p => p.completedQuizzes.includes(quiz._id));
      const scores = attempts.map(a => a.quizScores.find(s => s.quiz.equals(quiz._id)).score);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b) / scores.length)
        : 0;
      
      return {
        name: quiz.title,
        value: avgScore
      };
    });

    // Get student engagement per day
    const engagementData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const activeStudents = progress.filter(p => 
        p.lastAccessedAt >= date && p.lastAccessedAt < nextDate
      ).length;

      return {
        date: date.toLocaleDateString(),
        activeStudents
      };
    }).reverse();

    // Get student demographics
    const demographics = enrollments.reduce((acc, curr) => {
      const region = curr.student.region || 'Unknown';
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
    res.status(500).json({ error: 'Failed to get course analytics' });
  }
};

// Get progress statistics for a course
exports.getProgressStats = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    const progress = await Progress.find({ course: id });

    const moduleStats = course.modules.map(module => {
      const completedByStudents = progress.filter(p => 
        p.completedModules.includes(module._id)
      ).length;

      return {
        module: module.title,
        completionRate: progress.length > 0
          ? Math.round((completedByStudents / progress.length) * 100)
          : 0
      };
    });

    res.json(moduleStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get progress statistics' });
  }
};

// Get quiz statistics for a course
exports.getQuizStats = async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await Progress.find({ course: id });
    
    const scoreRanges = [
      { name: '90-100%', value: 0 },
      { name: '70-89%', value: 0 },
      { name: '50-69%', value: 0 },
      { name: '0-49%', value: 0 }
    ];

    progress.forEach(p => {
      p.quizScores.forEach(score => {
        if (score.score >= 90) scoreRanges[0].value++;
        else if (score.score >= 70) scoreRanges[1].value++;
        else if (score.score >= 50) scoreRanges[2].value++;
        else scoreRanges[3].value++;
      });
    });

    res.json(scoreRanges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get quiz statistics' });
  }
};
