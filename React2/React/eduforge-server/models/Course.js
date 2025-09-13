// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  duration: { type: String },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  modules: [
    {
      title: { type: String, required: true },
      description: { type: String },
      duration: { type: String },
      lessons: [
        {
          title: { type: String, required: true },
          content: { type: String },
          duration: { type: String },
          videoUrl: { type: String },
          resources: [{ title: String, url: String }]
        }
      ],
      quiz: {
        title: { type: String },
        timeLimit: { type: Number }, // in minutes
        questions: [
          {
            text: { type: String, required: true },
            options: [{
              text: { type: String, required: true },
              isCorrect: { type: Boolean, default: false }
            }]
          }
        ]
      }
    }
  ],
  enrolledStudents: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      enrolledAt: { type: Date, default: Date.now },
      progressPercentage: { type: Number, default: 0 },
      progress: [
        {
          moduleId: Number,
          completed: { type: Boolean, default: false },
          completedAt: Date
        }
      ],
      quizResults: [
        {
          moduleId: Number,
          score: Number,
          answers: [Number],
          attemptedAt: { type: Date, default: Date.now }
        }
      ],
      completedAt: Date,
      certificate: {
        issued: { type: Boolean, default: false },
        issuedAt: Date,
        certificateId: String
      }
    }
  ]
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
module.exports = Course;
