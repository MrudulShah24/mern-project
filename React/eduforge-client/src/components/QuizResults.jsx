import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCw } from 'lucide-react';

const QuizResults = ({ results, totalQuestions, onReview, onRetake }) => {
  const score = results.score || 0;
  const passed = results.passed || score >= 70; // Pass mark is 70%
  const correctCount = results.correctCount || 0;

  console.log('Quiz Results:', results);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`inline-block p-4 rounded-full mb-4 ${
          passed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
        }`}>
          {passed ? (
            <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          You scored {score}% ({correctCount} out of {totalQuestions} correct)
        </p>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg text-center">
          <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{totalQuestions}</div>
          <div className="text-sm text-purple-600 dark:text-purple-300">Questions</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
          <div className="text-xl font-bold text-green-700 dark:text-green-400">{correctCount}</div>
          <div className="text-sm text-green-600 dark:text-green-300">Correct</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-center">
          <div className="text-xl font-bold text-red-700 dark:text-red-400">{totalQuestions - correctCount}</div>
          <div className="text-sm text-red-600 dark:text-red-300">Incorrect</div>
        </div>
      </div>

      {/* Badge/Certificate */}
      {passed && (
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 rounded-lg text-center mb-8">
          <div className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-2">Achievement Unlocked!</div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            You've mastered this material and can now move on to the next section.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onReview}
          className="px-6 py-2 bg-white dark:bg-gray-700 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Review Answers
        </button>
        {!passed && (
          <button
            onClick={onRetake}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </button>
        )}
      </div>

      {/* Feedback Message */}
      {!passed && (
        <div className="text-center text-gray-600 dark:text-gray-400 mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="font-medium text-amber-700 dark:text-amber-400">Don't worry! Review the material and try again.</p>
          <p className="text-sm mt-1">You need 70% to pass this quiz.</p>
        </div>
      )}
    </div>
  );
};

export default QuizResults;