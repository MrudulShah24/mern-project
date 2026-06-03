const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

async function inspect() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduforgeDB';
  try {
    await mongoose.connect(uri);
    console.log('Connected');

    const enrollments = await Enrollment.find({ user: '68ad5c5d8bd7e68a950d6d5c' });
    
    for (const enrollment of enrollments) {
      const course = await Course.findById(enrollment.course);
      if (course && course.title.includes('CISSP')) {
        console.log(`\nEnrollment ID: ${enrollment._id}`);
        console.log(`Course Title: ${course.title} (Course ID: ${course._id})`);
        
        // Print progress modules
        enrollment.progress.forEach(p => {
          console.log(`  Module ID in enrollment: ${p.moduleId}`);
          const matchingMod = course.modules.id(p.moduleId);
          console.log(`    Is module in course? ${!!matchingMod}`);
          p.lessons.forEach(l => {
            console.log(`    Lesson ID in enrollment: ${l.lessonId}`);
            if (matchingMod) {
              const matchingLesson = matchingMod.lessons.id(l.lessonId);
              console.log(`      Is lesson in module? ${!!matchingLesson}`);
              if (matchingLesson && matchingLesson.quiz) {
                console.log(`        Quiz ID: ${matchingLesson.quiz._id}`);
              }
            }
          });
        });
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
