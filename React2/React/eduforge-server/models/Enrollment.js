const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 }, // percentage
  completedLessons: [{ type: String }], // Array of lesson IDs that have been completed
  completionDate: { type: Date }, // Date when the course was completed (100%)
  certificateId: { type: String } // Reference to certificate if generated
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
