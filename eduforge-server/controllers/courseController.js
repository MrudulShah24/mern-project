const Course = require('../models/Course');
const { populateEnrolledCount } = require('../utils/courseHelper');

// GET ALL COURSES
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name');
    const dynamicCourses = await populateEnrolledCount(courses);
    res.json(dynamicCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET A SINGLE COURSE BY ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(id)
      .populate('instructor', 'name email')
      .select('+modules'); // Explicitly include modules

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Initialize modules as an empty array if it doesn't exist
    if (!course.modules) {
      course.modules = [];
    }

    const dynamicCourse = await populateEnrolledCount(course);
    res.json(dynamicCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
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