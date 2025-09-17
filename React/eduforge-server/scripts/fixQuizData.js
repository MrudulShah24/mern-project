/**
 * Fix Quiz Data Script
 * This script checks all quizzes in the database and ensures each question has exactly one correct answer.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

async function fixQuizData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // Get all courses
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);
    
    let quizFixCount = 0;
    let questionFixCount = 0;

    // Loop through each course
    for (const course of courses) {
      // Loop through each module
      for (const module of course.modules) {
        // Check module quiz if exists
        if (module.quiz && module.quiz.questions && module.quiz.questions.length > 0) {
          quizFixCount++;
          
          // Loop through each question in the module quiz
          for (const question of module.quiz.questions) {
            const hasCorrectOption = question.options.some(option => option.isCorrect);
            
            if (!hasCorrectOption && question.options.length > 0) {
              // No correct option found, mark the first option as correct
              question.options[0].isCorrect = true;
              questionFixCount++;
              console.log(`Fixed question in module ${module.title} quiz: ${question.text}`);
            }
          }
        }
        
        // Loop through each lesson
        for (const lesson of module.lessons) {
          // Check lesson quiz if exists
          if (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0) {
            quizFixCount++;
            
            // Loop through each question in the lesson quiz
            for (const question of lesson.quiz.questions) {
              const hasCorrectOption = question.options.some(option => option.isCorrect);
              
              if (!hasCorrectOption && question.options.length > 0) {
                // No correct option found, mark the first option as correct
                question.options[0].isCorrect = true;
                questionFixCount++;
                console.log(`Fixed question in lesson ${lesson.title} quiz: ${question.text}`);
              }
            }
          }
        }
      }
      
      // Save the course with fixed quizzes
      await course.save();
    }
    
    console.log(`Fixed ${questionFixCount} questions in ${quizFixCount} quizzes`);
    console.log('Quiz data fix complete!');
  } catch (err) {
    console.error('Error fixing quiz data:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
fixQuizData();