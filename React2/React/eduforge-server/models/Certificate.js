const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  issuedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date, 
    required: true 
  },
  grade: { 
    type: String, 
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'Pass'],
    default: 'Pass'
  },
  verificationCode: { 
    type: String, 
    required: true,
    unique: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verifiedAt: Date,
  sharedCount: { 
    type: Number, 
    default: 0 
  },
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  metadata: {
    courseDuration: String,
    modulesCompleted: Number,
    totalModules: Number,
    completionPercentage: Number
  }
}, { timestamps: true });

// Generate unique certificate ID
certificateSchema.pre('save', async function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.certificateId = `EDU-${timestamp}-${random}`.toUpperCase();
  }
  
  if (!this.verificationCode) {
    this.verificationCode = Math.random().toString(36).substr(2, 12).toUpperCase();
  }
  
  next();
});

// Index for fast lookups
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ verificationCode: 1 });

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
module.exports = Certificate;
