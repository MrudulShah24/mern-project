const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
  generateCertificate,
  getCertificate,
  verifyCertificate,
  getUserCertificates,
  shareCertificate,
  downloadCertificate,
  getCertificateAnalytics
} = require('../controllers/certificateController');

// Generate certificate for completed course
router.post('/generate/:courseId', protect, generateCertificate);

// Get certificate for a specific course
router.get('/course/:courseId', protect, getCertificate);

// Verify certificate by ID (public)
router.get('/verify/:certificateId', verifyCertificate);

// Get all certificates for current user
router.get('/my-certificates', protect, getUserCertificates);

// Share certificate (increment share count)
router.post('/share/:certificateId', shareCertificate);

// Download certificate (increment download count)
router.post('/download/:certificateId', downloadCertificate);

// Get certificate analytics (admin only)
router.get('/analytics', protect, admin, getCertificateAnalytics);

module.exports = router;
