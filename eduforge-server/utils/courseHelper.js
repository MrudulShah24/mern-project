const Enrollment = require('../models/Enrollment');

/**
 * Dynamically updates the enrolledCount field of course object(s) with the actual
 * number of enrollment documents in the database.
 * Supports both a single Mongoose document/object or an array of them.
 */
const populateEnrolledCount = async (courses) => {
  if (!courses) return courses;
  
  const isArray = Array.isArray(courses);
  const coursesList = isArray ? courses : [courses];
  
  const updatedList = await Promise.all(
    coursesList.map(async (course) => {
      const courseObj = typeof course.toObject === 'function' ? course.toObject() : course;
      
      // Count actual enrollment records for this course
      const count = await Enrollment.countDocuments({ course: courseObj._id });
      courseObj.enrolledCount = count;
      
      return courseObj;
    })
  );
  
  return isArray ? updatedList : updatedList[0];
};

module.exports = { populateEnrolledCount };
