import React from 'react';
import { CheckCircle, AlertCircle, Eye, RefreshCw, Trophy, XCircle } from 'lucide-react';

const QuizResults = ({ results, totalQuestions, onReview, onRetake }) => {
  const score = results.score || 0;
  const passed = results.passed || score >= 70;
  const correctCount = results.correctCount || 0;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <div className="relative p-7 sm:p-8">
      {/* Ambient glow */}
      <div className={`absolute inset-0 rounded-2xl ${passed
        ? 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_60%)]'
        : 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.07),_transparent_60%)]'
      } pointer-events-none`} />

      {/* Score hero */}
      <div className="text-center mb-8 relative">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 border-4 ${
          passed
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
        }`}>
          {passed
            ? <Trophy className="w-10 h-10" />
            : <AlertCircle className="w-10 h-10" />
          }
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">
          {passed ? 'Excellent Work!' : 'Keep Practicing!'}
        </h2>
        <p className="text-slate-400">
          You scored{' '}
          <span className={`font-bold text-lg ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
            {score}%
          </span>
          {' '}— {correctCount} out of {totalQuestions} correct
        </p>

        {/* Score progress ring visual */}
        <div className="mt-5 w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              passed
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-center">
          <div className="text-2xl font-extrabold text-amber-400">{totalQuestions}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-400">{correctCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Correct</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-center">
          <div className="text-2xl font-extrabold text-red-400">{incorrectCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Wrong</div>
        </div>
      </div>

      {/* Achievement badge */}
      {passed && (
        <div className="relative rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-orange-500/8 p-5 text-center mb-7 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1),_transparent_70%)] pointer-events-none" />
          <div className="relative">
            <div className="text-amber-400 font-bold text-base mb-1">🏆 Achievement Unlocked!</div>
            <div className="text-slate-400 text-sm">You've mastered this material and can now move on to the next section.</div>
          </div>
        </div>
      )}

      {/* Failed hint */}
      {!passed && (
        <div className="rounded-2xl border border-amber-500/20 bg-white/3 p-4 text-center mb-7">
          <p className="text-amber-400 font-semibold text-sm">Don't worry! Review the material and try again.</p>
          <p className="text-slate-500 text-xs mt-1">You need 70% or higher to pass this quiz.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onReview}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/30 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold transition"
        >
          <Eye className="w-4 h-4" />
          Review Answers
        </button>
        {!passed && (
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 transition shadow-[0_6px_20px_rgba(245,158,11,0.25)]"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizResults;
