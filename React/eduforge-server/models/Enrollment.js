const mongoose = require('mongoose');

// Schema for individual lesson progress
const lessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  videoCompleted: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },
  exerciseCompleted: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { _id: false });

// Schema for module progress
const moduleProgressSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  lessons: [lessonProgressSchema]
}, { _id: false });

// Schema for quiz result
const quizResultSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true },
  answers: { type: Map, of: String },
  passed: { type: Boolean, default: false },
  attemptedAt: { type: Date, default: Date.now }
}, { _id: false });

// Schema for saved code
const savedCodeSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Schema for code submission
const codeSubmissionSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, required: true },
  passed: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progressPercentage: { type: Number, default: 0 }, // overall percentage
  progress: [moduleProgressSchema], // detailed progress tracking
  completedLessons: [{ type: String }], // legacy field - Array of lesson IDs that have been completed
  completionDate: { type: Date }, // Date when the course was completed (100%)
  certificateId: { type: String }, // Reference to certificate if generated
  quizResults: [quizResultSchema], // Array of quiz results
  savedCode: [savedCodeSchema], // Array of saved code snippets
  codeSubmissions: [codeSubmissionSchema], // Array of code submissions
  lastAccessedAt: { type: Date, default: Date.now } // Last time the course was accessed
}, { timestamps: true });

// Create index for faster queries
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
