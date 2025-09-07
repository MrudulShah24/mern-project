const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedModules: [{ type: Number }],
});

module.exports = mongoose.model('Progress', progressSchema);
