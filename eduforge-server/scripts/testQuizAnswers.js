const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Course = require('../models/Course');

async function testGrading() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduforgeDB';
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const course = await Course.findOne({ 'modules.lessons.quiz': { $exists: true } });
    if (!course) {
      console.log('No course found');
      return;
    }

    // Get the first quiz
    let quiz = null;
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.quiz) {
          quiz = lesson.quiz;
          break;
        }
      }
      if (quiz) break;
    }

    console.log('Testing quiz:', quiz.title, '(ID:', quiz._id, ')');

    // Create a mock answers object with correct answers
    const answers = {};
    quiz.questions.forEach((q) => {
      const correctOption = q.options.find(o => o.isCorrect);
      // We simulate what the frontend sends (option ID as a string)
      answers[q._id.toString()] = correctOption._id.toString();
    });

    console.log('Frontend Answers sent (mocked as correct):', answers);

    // Exact backend logic:
    let correctCount = 0;
    const results = [];
    const correctAnswers = {};
    const explanations = {};

    quiz.questions.forEach((question) => {
      const questionId = question._id.toString();
      const correctOption = question.options.find(o => o.isCorrect);
      
      if (correctOption) {
        correctAnswers[questionId] = correctOption._id.toString();
      }
      explanations[questionId] = question.explanation || '';
      
      const selectedAnswerId = answers[questionId];
      const isCorrect = selectedAnswerId === correctAnswers[questionId];
      
      console.log(`Question: ${question.text}`);
      console.log(`  questionId: ${questionId} (type: ${typeof questionId})`);
      console.log(`  correctAnswers[questionId]: ${correctAnswers[questionId]} (type: ${typeof correctAnswers[questionId]})`);
      console.log(`  selectedAnswerId: ${selectedAnswerId} (type: ${typeof selectedAnswerId})`);
      console.log(`  Is Correct? ${isCorrect}`);

      if (isCorrect) {
        correctCount++;
      }
      
      results.push({
        questionId,
        selectedAnswerId,
        correctAnswerId: correctAnswers[questionId],
        isCorrect
      });
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    console.log('Final Score:', score, '%');
    console.log('Correct count:', correctCount, 'out of', quiz.questions.length);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testGrading();
