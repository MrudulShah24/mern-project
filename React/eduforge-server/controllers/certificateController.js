const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

// Generate certificate when course is completed
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if course exists and user is enrolled
    const course = await Course.findById(courseId).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const studentRecord = course.enrolledStudents.find(
      s => s.student.toString() === userId.toString()
    );

    if (!studentRecord) {
      return res.status(400).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already has certificate
    if (studentRecord.certificate && studentRecord.certificate.issued) {
      return res.status(400).json({ error: 'Certificate already issued' });
    }

    // Check if course is completed (all modules completed)
    const totalModules = course.modules.length;
    const completedModules = studentRecord.progress.filter(p => p.completed).length;
    const completionPercentage = Math.round((completedModules / totalModules) * 100);

    if (completionPercentage < 100) {
      return res.status(400).json({ 
        error: 'Course not completed', 
        progress: completionPercentage,
        completedModules,
        totalModules
      });
    }

    // Calculate grade based on quiz performance
    let grade = 'Pass';
    if (studentRecord.quizResults && studentRecord.quizResults.length > 0) {
      const avgScore = studentRecord.quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / studentRecord.quizResults.length;
      if (avgScore >= 90) grade = 'A+';
      else if (avgScore >= 85) grade = 'A';
      else if (avgScore >= 80) grade = 'A-';
      else if (avgScore >= 75) grade = 'B+';
      else if (avgScore >= 70) grade = 'B';
      else if (avgScore >= 65) grade = 'B-';
      else if (avgScore >= 60) grade = 'C+';
      else if (avgScore >= 55) grade = 'C';
      else if (avgScore >= 50) grade = 'C-';
    }

    // Create certificate
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
      completedAt: studentRecord.completedAt || new Date(),
      grade,
      metadata: {
        courseDuration: course.duration,
        modulesCompleted: completedModules,
        totalModules,
        completionPercentage
      }
    });

    await certificate.save();

    // Update course enrollment with certificate info
    studentRecord.certificate = {
      issued: true,
      issuedAt: certificate.issuedAt,
      certificateId: certificate.certificateId
    };
    studentRecord.completedAt = certificate.completedAt;

    await course.save();

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate: {
        certificateId: certificate.certificateId,
        student: req.user.name,
        course: course.title,
        instructor: course.instructor.name,
        issuedAt: certificate.issuedAt,
        grade: certificate.grade
      }
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
};

// Get certificate by ID
exports.getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findOne({
      course: courseId,
      student: userId
    }).populate('course', 'title duration').populate('instructor', 'name email');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({
      certificateId: certificate.certificateId,
      student: req.user.name,
      course: certificate.course.title,
      instructor: certificate.instructor.name,
      issuedAt: certificate.issuedAt,
      grade: certificate.grade,
      verificationCode: certificate.verificationCode
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to get certificate' });
  }
};

// Verify certificate by ID
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('student', 'name email')
      .populate('course', 'title description duration')
      .populate('instructor', 'name email');

    if (!certificate) {
      return res.status(404).json({ 
        verified: false, 
        error: 'Certificate not found' 
      });
    }

    // Update verification count
    certificate.isVerified = true;
    certificate.verifiedAt = new Date();
    await certificate.save();

    res.json({
      verified: true,
      certificate: {
        certificateId: certificate.certificateId,
        student: certificate.student.name,
        course: certificate.course.title,
        instructor: certificate.instructor.name,
        issuedAt: certificate.issuedAt,
        grade: certificate.grade,
        metadata: certificate.metadata
      }
    });

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
};

// Get all certificates for a user
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user._id;

    const certificates = await Certificate.find({ student: userId })
      .populate('course', 'title thumbnail duration')
      .populate('instructor', 'name')
      .sort({ issuedAt: -1 });

    res.json(certificates);

  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({ error: 'Failed to get certificates' });
  }
};

// Share certificate (increment share count)
exports.shareCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOneAndUpdate(
      { certificateId },
      { $inc: { sharedCount: 1 } },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ message: 'Share count updated', sharedCount: certificate.sharedCount });

  } catch (error) {
    console.error('Share certificate error:', error);
    res.status(500).json({ error: 'Failed to update share count' });
  }
};

// Download certificate (increment download count)
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOneAndUpdate(
      { certificateId },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ message: 'Download count updated', downloadCount: certificate.downloadCount });

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ error: 'Failed to update download count' });
  }
};

// Get certificate analytics (admin only)
exports.getCertificateAnalytics = async (req, res) => {
  try {
    const total = await Certificate.countDocuments();
    const verified = await Certificate.countDocuments({ isVerified: true });
    
    const gradeDistribution = await Certificate.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const monthlyIssued = await Certificate.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$issuedAt' },
            month: { $month: '$issuedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      total,
      verified,
      gradeDistribution,
      monthlyIssued
    });

  } catch (error) {
    console.error('Certificate analytics error:', error);
    res.status(500).json({ error: 'Failed to get certificate analytics' });
  }
};
