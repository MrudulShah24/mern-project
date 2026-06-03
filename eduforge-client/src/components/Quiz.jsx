import React, { useState, useEffect } from 'react';
import lessonService from '../services/lessonService';
import { Check, X, ArrowLeft, ArrowRight, Award, Repeat } from 'lucide-react';
import QuizResults from './QuizResults';

const Quiz = ({ quizData, courseId, moduleId, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Quiz Data:', quizData);
    console.log('Quiz ID:', quizData._id);
    console.log('Module ID:', moduleId);
  }, [quizData, moduleId]);

  const handleAnswerSelect = (questionId, optionId) => {
    if (isReviewMode) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionId });
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!courseId) throw new Error('Course ID is required');
      if (!moduleId) throw new Error('Module ID is required');
      if (!quizData._id) throw new Error('Quiz ID is required');
      const response = await lessonService.submitQuiz(courseId, moduleId, quizData._id, selectedAnswers);
      setResults(response);
      setShowResults(true);
      if (onComplete) onComplete(response.score);
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
      const isCorrectAnswer = results?.questions &&
        results.questions.find(q => q.id === currentQuestion._id)?.options.find(o => o.id === option._id)?.isCorrect;
      if (isCorrectAnswer) return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
      if (isSelected && !isCorrectAnswer) return 'border-red-500/60 bg-red-500/10 text-red-300';
      return 'border-amber-500/20 text-slate-400';
    }
    return isSelected
      ? 'border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/30 text-amber-200'
      : 'border-amber-500/20 bg-white/3 hover:border-amber-500/30 hover:bg-amber-500/5 text-slate-300';
  };

  const progressPct = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.07),_transparent_60%)] pointer-events-none" />

      <div className="relative p-7 sm:p-8">

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-sm">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Header */}
        <div className="mb-7">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">{quizData.title}</h2>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {currentQuestionIndex + 1} / {quizData.questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8 min-h-[220px]">
          <p className="text-lg font-semibold text-white mb-5 leading-relaxed">
            {currentQuestion.text}
          </p>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option._id}
                onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
                disabled={isReviewMode}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${getOptionClass(option)}`}
              >
                <span className="font-medium">{option.text}</span>
                {isReviewMode && (() => {
                  const isCorrectOption = results?.questions &&
                    results.questions.find(q => q.id === currentQuestion._id)?.options.find(o => o.id === option._id)?.isCorrect;
                  if (isCorrectOption) return <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
                  if (selectedAnswers[currentQuestion._id] === option._id && !isCorrectOption)
                    return <X className="w-5 h-5 text-red-400 flex-shrink-0" />;
                  return null;
                })()}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-5 border-t border-amber-500/20">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentQuestionIndex === quizData.questions.length - 1 ? (
            <button
              onClick={isReviewMode ? handleRetake : handleSubmitQuiz}
              disabled={loading || (!selectedAnswers[currentQuestion._id] && !isReviewMode)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 transition shadow-[0_6px_20px_rgba(245,158,11,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isReviewMode ? (
                <><Repeat className="w-4 h-4" /> Retake Quiz</>
              ) : loading ? 'Submitting...' : (
                <><Award className="w-4 h-4" /> Submit Quiz</>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={!selectedAnswers[currentQuestion._id] && !isReviewMode}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 transition shadow-[0_6px_20px_rgba(245,158,11,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
