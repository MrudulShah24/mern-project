const Course = require('../models/Course');

// GET ALL COURSES
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADD THIS FUNCTION TO GET A SINGLE COURSE
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name'); // This fetches the instructor's name

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// CREATE A NEW COURSE
exports.createCourse = async (req, res) => {
  try {
    // Make sure to get the logged-in user's ID for the instructor field
    const { title, description, modules } = req.body;
    const instructorId = req.user.id; // Assumes your auth middleware adds user to req

    const course = new Course({
      title,
      description,
      instructor: instructorId,
      modules,
    });
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};