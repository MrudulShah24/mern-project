const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from eduforge-server's .env file
dotenv.config();

const Course = require('../models/Course');

async function checkQuizzes() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduforgeDB';
  console.log('Connecting to MongoDB at:', uri);
  try {
    await mongoose.connect(uri);
    console.log('Connected successfully!');

    const course = await Course.findOne({ 'modules.lessons.quiz': { $exists: true } });
    if (!course) {
      console.log('No course with quizzes found!');
      return;
    }

    console.log('Found course:', course.title);
    for (const mod of course.modules) {
      console.log('Module:', mod.title);
      for (const lesson of mod.lessons) {
        if (lesson.quiz) {
          console.log('  Lesson:', lesson.title, 'Quiz:', lesson.quiz.title);
          console.log('  Quiz ID:', lesson.quiz._id);
          lesson.quiz.questions.forEach((q, idx) => {
            console.log(`    Q${idx + 1}: ${q.text} (ID: ${q._id})`);
            q.options.forEach(o => {
              console.log(`      - Option: ${o.text} (ID: ${o._id}) [isCorrect: ${o.isCorrect}]`);
            });
          });
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkQuizzes();
