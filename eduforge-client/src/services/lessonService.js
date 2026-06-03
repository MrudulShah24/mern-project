import axios from '../utils/axiosConfig';

// Get lesson content with progress tracking
export const getLessonContent = async (courseId, moduleId, lessonId) => {
  try {
    const response = await axios.get(`/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson content:', error);
    throw error;
  }
};

// Get just the progress for a specific lesson
export const getLessonProgress = async (courseId, moduleId, lessonId) => {
  try {
    const response = await axios.get(`/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    throw error;
  }
};

// Update lesson progress
export const updateLessonProgress = async (courseId, moduleId, lessonId, progressData) => {
  try {
    const response = await axios.post(
      `/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/progress`,
      progressData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

// Mark a lesson as fully completed
export const markLessonComplete = async (courseId, moduleId, lessonId) => {
  try {
    const response = await axios.post(
      `/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/complete`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking lesson as complete:', error);
    throw error;
  }
};

// Submit quiz answers
export const submitQuiz = async (courseId, moduleId, quizId, answers) => {
  try {
    console.log('Submitting quiz:', { courseId, moduleId, quizId });
    
    if (!moduleId) {
      console.error('Module ID is undefined. Cannot submit quiz without a module ID.');
      throw new Error('Module ID is required to submit a quiz');
    }
    
    const response = await axios.post(
      `/lessons/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}/submit`,
      { answers }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

// Save code exercise progress (without submitting)
export const saveCode = async (courseId, moduleId, lessonId, code) => {
  try {
    const response = await axios.post(
      `/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/code/save`,
      { code }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving code:', error);
    throw error;
  }
};

// Get user's saved code for an exercise
export const getSavedCode = async (courseId, moduleId, lessonId) => {
  try {
    const response = await axios.get(
      `/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/code`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching saved code:', error);
    throw error;
  }
};

// Submit code for exercise evaluation
export const submitCode = async (courseId, moduleId, lessonId, code) => {
  try {
    const response = await axios.post(
      `/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/code/submit`,
      { code }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting code:', error);
    throw error;
  }
};

// Run code without submitting (for practice/testing)
export const runCode = async (code, language = 'javascript') => {
  try {
    const response = await axios.post('/lessons/code/run', { code, language });
    return response.data;
  } catch (error) {
    console.error('Error running code:', error);
    throw error;
  }
};

// Get resources for a specific lesson
export const getLessonResources = async (courseId, moduleId, lessonId) => {
  try {
    const response = await axios.get(`/lessons/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson resources:', error);
    throw error;
  }
};

export default {
  getLessonContent,
  getLessonProgress,
  updateLessonProgress,
  markLessonComplete,
  submitQuiz,
  saveCode,
  getSavedCode,
  submitCode,
  runCode,
  getLessonResources
};