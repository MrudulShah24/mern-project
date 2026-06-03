const mongoose = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/node_modules/mongoose');
const User = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/User');
const Enrollment = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/Enrollment');
const Course = require('C:/Users/mrudu/OneDrive/Desktop/MERN_PROJECT/mern-project/eduforge-server/models/Course');

const MONGO_URI = 'mongodb://localhost:27017/eduforgeDB';

async function findRecentCompletions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const enrollments = await Enrollment.find().populate('user', 'name email').populate('course', 'title');
    const completions = [];

    for (const e of enrollments) {
      if (e.progress) {
        e.progress.forEach(mod => {
          if (mod.lessons) {
            mod.lessons.forEach(les => {
              if (les.completed) {
                completions.push({
                  userName: e.user ? e.user.name : 'Unknown',
                  userEmail: e.user ? e.user.email : 'No email',
                  courseTitle: e.course ? e.course.title : 'Unknown',
                  lessonId: les.lessonId,
                  completedAt: les.completedAt
                });
              }
            });
          }
        });
      }
    }

    // Sort by completedAt descending
    completions.sort((a, b) => {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    console.log(`Total completed lessons found: ${completions.length}`);
    console.log('Top 15 most recent completions:');
    completions.slice(0, 15).forEach((c, idx) => {
      console.log(`${idx + 1}. User: ${c.userName} (${c.userEmail}) | Course: ${c.courseTitle} | Lesson ID: ${c.lessonId} | CompletedAt: ${c.completedAt}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

findRecentCompletions();
