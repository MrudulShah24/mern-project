import React, { useState, useEffect } from 'react';
import lessonService from '../services/lessonService';
import { Check, X, ArrowLeft, ArrowRight, Award, Repeat } from 'lucide-react';
import QuizResults from './QuizResults'; // Assuming QuizResults is in a separate component

const Quiz = ({ quizData, courseId, moduleId, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [error, setError] = useState(null);

  // Log quiz data for debugging
  useEffect(() => {
    console.log('Quiz Data:', quizData);
    console.log('Quiz ID:', quizData._id);
    console.log('Module ID:', moduleId);
  }, [quizData, moduleId]);

  const handleAnswerSelect = (questionId, optionId) => {
    if (isReviewMode) return; // Don't allow changing answers in review mode
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId
    });
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if we have all the required IDs
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      if (!moduleId) {
        throw new Error('Module ID is required');
      }
      if (!quizData._id) {
        throw new Error('Quiz ID is required');
      }
      
      // Log the submission details
      console.log('Submitting quiz with:', {
        courseId,
        moduleId,
        quizId: quizData._id,
        answers: selectedAnswers
      });
      
      // Use lessonService to submit the quiz
      const response = await lessonService.submitQuiz(
        courseId, 
        moduleId, 
        quizData._id, 
        selectedAnswers
      );
      setResults(response);
      setShowResults(true);
      if (onComplete) {
        onComplete(response.score);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz. Please try again.');
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = () => {
    setShowResults(false);
    setIsReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setResults(null);
    setIsReviewMode(false);
  };

  const currentQuestion = quizData.questions[currentQuestionIndex];

  if (showResults && results) {
    return (
      <QuizResults 
        results={results} 
        totalQuestions={quizData.questions.length}
        onReview={handleReview}
        onRetake={handleRetake}
      />
    );
  }

  const getOptionClass = (option) => {
    const isSelected = selectedAnswers[currentQuestion._id] === option._id;
    if (isReviewMode) {
      // Check if this option is the correct answer
      const isCorrectAnswer = results.questions && 
        results.questions.find(q => q.id === currentQuestion._id)?.options.find(o => o.id === option._id)?.isCorrect;
        
      if (isCorrectAnswer) {
        return 'border-green-500 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      }
      if (isSelected && !isCorrectAnswer) {
        return 'border-red-500 bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      }
      return 'border-gray-200 dark:border-gray-600';
    }
    return isSelected
      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/50 ring-2 ring-purple-500'
      : 'border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          <p className="font-semibold">Error: {error}</p>
          <p className="text-sm mt-1">Please try again or contact support if the issue persists.</p>
        </div>
      )}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{quizData.title}</h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`
            }}
          />
        </div>
      </div>

      <div className="mb-8 min-h-[250px]">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentQuestion.text}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option._id}
              onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
              disabled={isReviewMode}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${getOptionClass(option)}`}
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">{option.text}</span>
              {isReviewMode && (
                <>
                  {/* Determine if this option is correct */}
                  {(() => {
                    const isCorrectOption = results.questions && 
                      results.questions.find(q => q.id === currentQuestion._id)?.options.find(o => o.id === option._id)?.isCorrect;
                    
                    if (isCorrectOption) {
                      return <Check className="w-6 h-6 text-green-500" />;
                    }
                    if (selectedAnswers[currentQuestion._id] === option._id && !isCorrectOption) {
                      return <X className="w-6 h-6 text-red-500" />;
                    }
                    return null;
                  })()}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        {currentQuestionIndex === quizData.questions.length - 1 ? (
          <button
            onClick={isReviewMode ? handleRetake : handleSubmitQuiz}
            disabled={loading || (!selectedAnswers[currentQuestion._id] && !isReviewMode)}
            className="flex items-center px-6 py-2 rounded-lg transition-colors font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {isReviewMode ? (
              <>
                <Repeat className="w-4 h-4 mr-2" />
                Retake Quiz
              </>
            ) : loading ? 'Submitting...' : (
              <>
                <Award className="w-4 h-4 mr-2" />
                Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!selectedAnswers[currentQuestion._id] && !isReviewMode}
            className="flex items-center px-4 py-2 rounded-lg transition-colors text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
