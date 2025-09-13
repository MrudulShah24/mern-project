import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const QuizResults = ({ results, questions, onRetry, onContinue }) => {
  const score = (results.filter(r => r.correct).length / results.length) * 100;
  const passed = score >= 70; // Pass mark is 70%

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`inline-block p-4 rounded-full mb-4 ${
          passed ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-500" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>
        <p className="text-gray-600">
          You scored {Math.round(score)}% ({results.filter(r => r.correct).length} out of {results.length} correct)
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-4 mb-8">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              result.correct ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-start">
              {result.correct ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-1 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium mb-2">
                  Question {index + 1}: {questions[index].question}
                </p>
                <div className="space-y-2">
                  {questions[index].options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded ${
                        optIndex === questions[index].correctAnswer
                          ? 'bg-green-100 text-green-700'
                          : optIndex === result.answer && !result.correct
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-50'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {!result.correct && (
                  <p className="text-sm text-red-600 mt-2">
                    Correct answer: {questions[index].options[questions[index].correctAnswer]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {!passed && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          {passed ? 'Continue to Next Module' : 'Review Material'}
        </button>
      </div>

      {/* Feedback Message */}
      {!passed && (
        <p className="text-center text-gray-600 mt-6">
          Don't worry! Review the material and try again. You need 70% to pass.
        </p>
      )}
    </div>
  );
};

export default QuizResults;
