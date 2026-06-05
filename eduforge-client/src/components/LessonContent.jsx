import React, { useState, useEffect } from 'react';
import { Book, Video, FileText, CheckCircle, Zap, Code } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import Quiz from './Quiz';
import CodeExercise from './CodeExercise';
import lessonService from '../services/lessonService';


const LessonContent = ({ lesson, courseId, moduleId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lessonData, setLessonData] = useState(lesson);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [progress, setProgress] = useState({
    videoCompleted: false,
    quizCompleted: false,
    exerciseCompleted: false,
    quizScore: 0,
    completed: false
  });

  useEffect(() => {
    setLessonData(lesson);
  }, [lesson]);

  useEffect(() => {
    const fetchLessonProgress = async () => {
      try {
        setLoading(true);
        if (lesson?._id) {
          const lessonResponse = await lessonService.getLessonContent(courseId, moduleId, lesson._id);
          if (lessonResponse) {
            setLessonData(lessonResponse);
            const progressData = lessonResponse.progress || {};
            setProgress({
              videoCompleted: progressData.videoCompleted || false,
              quizCompleted: progressData.quizCompleted || false,
              exerciseCompleted: progressData.exerciseCompleted || false,
              quizScore: progressData.quizScore || 0,
              completed: progressData.completed || false
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch lesson progress:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && moduleId && lesson) {
      fetchLessonProgress();
    }
  }, [courseId, moduleId, lesson]);

  const checkAllCompleted = (updatedProgress = {}) => {
    const nextProgress = { ...progress, ...updatedProgress };
    const hasVideo = lessonData.type === 'video' || !!lessonData.videoUrl;
    const hasQuiz = lessonData.type === 'quiz' || (!!lessonData.quiz && lessonData.quiz.questions && lessonData.quiz.questions.length > 0);
    const hasExercise = !!lessonData.codeExercise;
    
    const videoComplete = !hasVideo || nextProgress.videoCompleted;
    const quizComplete = !hasQuiz || nextProgress.quizCompleted;
    const exerciseComplete = !hasExercise || nextProgress.exerciseCompleted;
    
    if (videoComplete && quizComplete && exerciseComplete) {
      onComplete && onComplete();
    }
  };

  const handleVideoComplete = async () => {
    try {
      await lessonService.updateLessonProgress(courseId, moduleId, lessonData._id, {
        videoCompleted: true
      });
      setProgress(prev => {
        const next = { ...prev, videoCompleted: true };
        checkAllCompleted(next);
        return next;
      });
    } catch (err) {
      console.error('Failed to update video progress:', err);
    }
  };

  const handleQuizComplete = async (score) => {
    try {
      await lessonService.updateLessonProgress(courseId, moduleId, lessonData._id, {
        quizCompleted: true,
        quizScore: score
      });
      setProgress(prev => {
        const next = { ...prev, quizCompleted: true, quizScore: score };
        checkAllCompleted(next);
        return next;
      });
    } catch (err) {
      console.error('Failed to update quiz progress:', err);
    }
  };

  const handleExerciseComplete = async () => {
    try {
      await lessonService.updateLessonProgress(courseId, moduleId, lessonData._id, {
        exerciseCompleted: true
      });
      setProgress(prev => {
        const next = { ...prev, exerciseCompleted: true };
        checkAllCompleted(next);
        return next;
      });
    } catch (err) {
      console.error('Failed to update exercise progress:', err);
    }
  };

  /* ─── Loading skeleton ─── */
  if (loading && !lessonData) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 bg-white/5 rounded-lg w-2/3" />
        <div className="h-56 bg-white/5 rounded-xl" />
        <div className="h-28 bg-white/5 rounded-xl" />
      </div>
    );
  }

  /* ─── Error ─── */
  if (error) {
    return (
      <div className="text-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Lesson</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:brightness-110 transition shadow-[0_8px_20px_rgba(245,158,11,0.25)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!lessonData) return null;

  /* ─── Lesson type badge helper ─── */
  const LessonTypeBadge = ({ type }) => {
    const map = {
      video:   { icon: <Video className="w-3.5 h-3.5" />,    label: 'Video',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
      article: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Reading',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
      quiz:    { icon: <Book className="w-3.5 h-3.5" />,     label: 'Quiz',     cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
      code:    { icon: <Code className="w-3.5 h-3.5" />,     label: 'Coding',   cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
    };
    const t = map[type] || { icon: <Zap className="w-3.5 h-3.5" />, label: 'Lesson', cls: 'bg-white/10 text-slate-400 border-amber-500/20' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${t.cls}`}>
        {t.icon}{t.label}
      </span>
    );
  };

  /* ─── Content wrappers ─── */
  const glassCard = "relative glass-panel overflow-hidden bg-white/10 dark:bg-white/3";

  const renderLessonContent = () => {
    switch (lessonData.type) {
      case 'video':
        return (
          <div className={glassCard}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.04),_transparent_60%)] pointer-events-none" />
            <VideoPlayer
              videoUrl={lessonData.videoUrl}
              title={lessonData.title}
              onComplete={handleVideoComplete}
              autoComplete={false}
            />
            {lessonData.content && (
              <div className="p-6 border-t border-amber-500/20">
                <div className="prose prose-invert prose-amber max-w-none text-slate-300">
                  <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
                </div>
              </div>
            )}
          </div>
        );

      case 'article':
        return (
          <div className={`${glassCard} p-7`}>
            <div className="prose prose-invert prose-amber max-w-none text-slate-300">
              <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className={`${glassCard} p-1`}>
            <Quiz
              quizData={lessonData.quiz || { questions: lessonData.questions || [] }}
              courseId={courseId}
              moduleId={moduleId}
              onComplete={handleQuizComplete}
            />
          </div>
        );

      case 'code':
        return (
          <CodeExercise
            exerciseData={lessonData.codeExercise}
            courseId={courseId}
            moduleId={moduleId}
            lessonId={lessonData._id}
            onComplete={handleExerciseComplete}
          />
        );

      default:
        return (
          <div className="space-y-5">
            {lessonData.videoUrl && (
              <div className={glassCard}>
                <VideoPlayer
                  videoUrl={lessonData.videoUrl}
                  title={lessonData.title}
                  onComplete={handleVideoComplete}
                  autoComplete={false}
                />
              </div>
            )}

            {lessonData.content && (
              <div className={`${glassCard} p-7`}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Reading Material
                </h2>
                <div className="prose prose-invert prose-amber max-w-none text-slate-300">
                  <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
                </div>
              </div>
            )}

            {lessonData.quiz && lessonData.quiz.questions && lessonData.quiz.questions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5 text-amber-400" />
                  Knowledge Check
                </h2>
                <div className={`${glassCard} p-1`}>
                  <Quiz
                    quizData={lessonData.quiz}
                    courseId={courseId}
                    moduleId={moduleId}
                    onComplete={handleQuizComplete}
                  />
                </div>
              </div>
            )}

            {lessonData.codeExercise && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-amber-400" />
                  Coding Exercise
                </h2>
                <CodeExercise
                  exerciseData={lessonData.codeExercise}
                  courseId={courseId}
                  moduleId={moduleId}
                  lessonId={lessonData._id}
                  onComplete={handleExerciseComplete}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* Lesson header card */}
      <div className="glass-panel p-6">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.05),_transparent_60%)] pointer-events-none" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-white leading-tight">{lessonData.title}</h1>
          <LessonTypeBadge type={lessonData.type} />
        </div>

        {/* Progress indicators */}
        <div className="flex flex-wrap gap-3 mt-3">
          {(lessonData.type === 'video' || lessonData.videoUrl) && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${progress.videoCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Video className="w-3.5 h-3.5" />
              Video
              {progress.videoCompleted && <CheckCircle className="w-3.5 h-3.5" />}
            </span>
          )}
          {(lessonData.type === 'quiz' || (lessonData.quiz?.questions?.length > 0)) && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${progress.quizCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Book className="w-3.5 h-3.5" />
              Quiz {progress.quizCompleted && `• ${progress.quizScore}%`}
              {progress.quizCompleted && <CheckCircle className="w-3.5 h-3.5" />}
            </span>
          )}
          {lessonData.codeExercise && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${progress.exerciseCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Code className="w-3.5 h-3.5" />
              Coding Exercise
              {progress.exerciseCompleted && <CheckCircle className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {renderLessonContent()}

      {/* Mark Complete / Completed button */}
      <div className="flex justify-end pt-2">
        {progress.completed ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-5 py-2.5 text-emerald-400 font-semibold">
            <CheckCircle className="h-5 w-5" />
            Lesson Completed
          </div>
        ) : (
          <button
            onClick={async () => {
              try {
                setIsMarkingComplete(true);
                await lessonService.markLessonComplete(courseId, moduleId, lessonData._id);
                setProgress(prev => ({ ...prev, completed: true }));
                onComplete && onComplete();
              } catch (err) {
                console.error('Failed to mark lesson as complete:', err);
              } finally {
                setIsMarkingComplete(false);
              }
            }}
            disabled={isMarkingComplete}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:brightness-110 transition shadow-[0_8px_24px_rgba(245,158,11,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isMarkingComplete ? 'Marking...' : 'Mark as Completed'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonContent;
