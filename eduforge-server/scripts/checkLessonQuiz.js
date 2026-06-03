const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Course = require('../models/Course');

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduforgeDB';
  try {
    await mongoose.connect(uri);
    console.log('Connected');

    const course = await Course.findOne({ 'modules.lessons._id': '68cae0fabb835edfd0d2edac' });
    if (!course) {
      console.log('Course not found');
      return;
    }
    
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson._id.toString() === '68cae0fabb835edfd0d2edac') {
          console.log('Lesson Title:', lesson.title);
          console.log('Quiz details:', lesson.quiz);
          if (lesson.quiz) {
            lesson.quiz.questions.forEach((q, qidx) => {
              console.log(`Question ${qidx+1}: ${q.text} (ID: ${q._id})`);
              q.options.forEach((o, oidx) => {
                console.log(`  Option ${oidx+1}: ${o.text} (ID: ${o._id}) [isCorrect: ${o.isCorrect}]`);
              });
            });
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

check();
