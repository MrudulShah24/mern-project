const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  helpfulness: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  courseCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  flaggedForModeration: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a compound unique index on user and course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Calculate helpfulCount before saving
reviewSchema.pre('save', function(next) {
  if (this.isModified('helpfulBy')) {
    this.helpfulCount = this.helpfulBy.length;
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);