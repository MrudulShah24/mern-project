// models/Course.js
const mongoose = require('mongoose');

// Quiz option schema
const quizOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: true });

// Quiz question schema
const quizQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [quizOptionSchema],
  explanation: { type: String } // Explanation shown after answering
}, { _id: true });

// Quiz schema
const quizSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  timeLimit: { type: Number }, // in minutes
  passingScore: { type: Number, default: 70 }, // percentage needed to pass
  questions: [quizQuestionSchema]
}, { _id: true });

// Code exercise schema
const codeExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String, required: true },
  language: { 
    type: String, 
    enum: ['javascript', 'python', 'java', 'c++', 'typescript', 'html', 'css'], 
    default: 'javascript' 
  },
  starterCode: { type: String }, // Initial code to show in the editor
  expectedPatterns: [{ type: String }], // Patterns that should be in the solution
  avoidPatterns: [{ type: String }], // Patterns that should not be in the solution
  testCases: [{ 
    input: { type: String },
    expectedOutput: { type: String },
    hidden: { type: Boolean, default: false } // Whether to show this test case to the student
  }],
  solutionCode: { type: String }, // Reference solution (not shown to students)
  hints: [{ type: String }], // Hints that can be revealed if stuck
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
}, { _id: true });

// Resource schema
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['article', 'video', 'pdf', 'link', 'book'], 
    default: 'link' 
  },
  url: { type: String, required: true },
  description: { type: String }
}, { _id: true });

// Lesson schema
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String }, // HTML/Markdown content
  duration: { type: Number }, // in minutes
  videoUrl: { type: String },
  videoProvider: { 
    type: String, 
    enum: ['youtube', 'vimeo', 'custom'], 
    default: 'youtube' 
  },
  resources: [resourceSchema],
  quiz: quizSchema,
  codeExercise: codeExerciseSchema,
  order: { type: Number, required: true } // Position in the module
}, { _id: true });

// Module schema
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number }, // in minutes
  lessons: [lessonSchema],
  quiz: quizSchema, // End-of-module quiz
  order: { type: Number, required: true } // Position in the course
}, { _id: true });

// Course schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Co-instructors
  price: { type: Number, default: 0 },
  discount: {
    percentage: { type: Number, default: 0 },
    validUntil: { type: Date }
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  category: { type: String },
  subcategory: { type: String },
  tags: [{ type: String }], // For searching and filtering
  thumbnail: { type: String },
  duration: { type: Number }, // Total duration in minutes
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  learningObjectives: [{ type: String }],
  prerequisites: [{ type: String }],
  targetAudience: [{ type: String }], // Who this course is for
  modules: [moduleSchema],
  finalExam: quizSchema, // Final course exam
  certificateAvailable: { type: Boolean, default: true },
  certificateTemplate: { type: String }, // Template ID for certificate
  enrolledCount: { type: Number, default: 0 }, // Number of students enrolled
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  language: { type: String, default: 'English' },
  featured: { type: Boolean, default: false }, // For highlighting on homepage
  publishedAt: { type: Date }, // When the course was made public
  updatedAt: { type: Date, default: Date.now }, // Last major content update
  enrolledStudents: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrolledAt: { type: Date, default: Date.now },
    progressPercentage: { type: Number, default: 0 },
    progress: [{
      moduleId: { type: mongoose.Schema.Types.ObjectId },
      completed: { type: Boolean, default: false },
      lessons: [{
        lessonId: { type: mongoose.Schema.Types.ObjectId },
        completed: { type: Boolean, default: false }
      }]
    }]
  }]
}, { timestamps: true });

// Virtual field for calculated properties
courseSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((count, module) => count + module.lessons.length, 0);
});

courseSchema.virtual('totalVideos').get(function() {
  return this.modules.reduce((count, module) => {
    return count + module.lessons.filter(lesson => lesson.videoUrl).length;
  }, 0);
});

courseSchema.virtual('totalQuizzes').get(function() {
  let count = this.finalExam ? 1 : 0;
  
  this.modules.forEach(module => {
    if (module.quiz && module.quiz.questions.length > 0) count++;
    
    module.lessons.forEach(lesson => {
      if (lesson.quiz && lesson.quiz.questions.length > 0) count++;
    });
  });
  
  return count;
});

courseSchema.virtual('totalExercises').get(function() {
  return this.modules.reduce((count, module) => {
    return count + module.lessons.filter(lesson => lesson.codeExercise).length;
  }, 0);
});

// Create text index for search
courseSchema.index({
  title: 'text',
  description: 'text',
  'modules.title': 'text',
  'modules.lessons.title': 'text',
  tags: 'text'
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
module.exports = Course;
