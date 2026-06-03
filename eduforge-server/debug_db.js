const mongoose = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/node_modules/mongoose');
const User = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/User');
const Enrollment = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/Enrollment');
const Course = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/Course');

const MONGO_URI = 'mongodb://localhost:27017/eduforgeDB';

async function debug() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const enrollments = await Enrollment.find().populate('user', 'name email').populate('course', 'title');
    console.log(`Found ${enrollments.length} enrollments in total.`);

    for (const e of enrollments) {
      console.log(`\nEnrollment: ${e._id}`);
      console.log(`User: ${e.user ? e.user.name : 'Unknown'} (${e.user ? e.user.email : 'No email'})`);
      console.log(`Course: ${e.course ? e.course.title : 'Unknown'}`);
      console.log(`Progress Percentage: ${e.progressPercentage}%`);
      console.log(`Completed Lessons (Flat Array):`, e.completedLessons);
      
      console.log(`Progress array length: ${e.progress.length}`);
      e.progress.forEach((mod, modIdx) => {
        console.log(`  Module index ${modIdx} (ID: ${mod.moduleId}): completed=${mod.completed}, completedAt=${mod.completedAt}`);
        console.log(`  Lessons count: ${mod.lessons ? mod.lessons.length : 0}`);
        if (mod.lessons) {
          mod.lessons.forEach((les, lesIdx) => {
            console.log(`    Lesson ID: ${les.lessonId}: completed=${les.completed}, completedAt=${les.completedAt}`);
          });
        }
      });
    }
  } catch (err) {
    console.error('Error during debug run:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

debug();
