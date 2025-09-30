import React, { useState, useEffect } from 'react';
import { Book, Video, FileText, CheckCircle } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import Quiz from './Quiz';
import lessonService from '../services/lessonService';

const LessonContent = ({ lesson, courseId, moduleId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    videoCompleted: false,
    quizCompleted: false,
    quizScore: 0
  });
  
  // Fetch lesson progress data if not included in the lesson
  useEffect(() => {
    const fetchLessonProgress = async () => {
      try {
        setLoading(true);
        if (lesson._id) {
          const progressData = await lessonService.getLessonProgress(courseId, moduleId, lesson._id);
          
          // Set progress from the API response
          if (progressData) {
            setProgress({
              videoCompleted: progressData.videoCompleted || false,
              quizCompleted: progressData.quizCompleted || false,
              quizScore: progressData.quizScore || 0
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch lesson progress:', err);
        // Don't show error for progress fetch failure
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId && moduleId && lesson) {
      fetchLessonProgress();
    }
  }, [courseId, moduleId, lesson]);
  
  // Handle video completion
  const handleVideoComplete = async () => {
    try {
      await lessonService.updateLessonProgress(courseId, moduleId, lesson._id, {
        videoCompleted: true
      });
      
      setProgress(prev => ({
        ...prev,
        videoCompleted: true
      }));
      
      // Check if all components are completed
      checkAllCompleted();
    } catch (err) {
      console.error('Failed to update video progress:', err);
    }
  };
  
  // Handle quiz completion
  const handleQuizComplete = async (score) => {
    try {
      await lessonService.updateLessonProgress(courseId, moduleId, lesson._id, {
        quizCompleted: true,
        quizScore: score
      });
      
      setProgress(prev => ({
        ...prev,
        quizCompleted: true,
        quizScore: score
      }));
      
      // Check if all components are completed
      checkAllCompleted();
    } catch (err) {
      console.error('Failed to update quiz progress:', err);
    }
  };
  
  // No longer need handleExerciseComplete as we've removed coding exercises
  
  // Check if all required components are completed
  const checkAllCompleted = () => {
    // Only check components that exist in the lesson
    const hasVideo = lesson.type === 'video' || !!lesson.videoUrl;
    const hasQuiz = lesson.type === 'quiz' || (!!lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0);
    
    const videoComplete = !hasVideo || progress.videoCompleted;
    const quizComplete = !hasQuiz || progress.quizCompleted;
    
    if (videoComplete && quizComplete) {
      // Everything is complete, call the onComplete callback
      onComplete && onComplete();
    }
  };
  
  if (loading && !lesson) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Error Loading Lesson</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!lesson) return null;
  
  // Determine content based on lesson type
  const renderLessonContent = () => {
    switch(lesson.type) {
      case 'video':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <VideoPlayer 
              videoUrl={lesson.videoUrl}
              title={lesson.title}
              onComplete={handleVideoComplete}
              autoComplete={false}
            />
            {lesson.content && (
              <div className="p-6">
                <div className="prose prose-purple max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'article':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="prose prose-purple max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          </div>
        );
        
      case 'quiz':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <Quiz 
              quizData={lesson.quiz || { questions: lesson.questions || [] }} 
              courseId={courseId}
              moduleId={moduleId}
              onComplete={handleQuizComplete}
            />
          </div>
        );
        

      default:
        // Fallback for mixed content or old format
        return (
          <div className="space-y-8">
            {/* Video Content */}
            {lesson.videoUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <VideoPlayer 
                  videoUrl={lesson.videoUrl}
                  title={lesson.title}
                  onComplete={handleVideoComplete}
                  autoComplete={false}
                />
              </div>
            )}
            
            {/* Reading Material */}
            {lesson.content && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reading Material</h2>
                <div className="prose prose-purple max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              </div>
            )}
            
            {/* Quiz */}
            {lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Knowledge Check</h2>
                <Quiz 
                  quizData={lesson.quiz} 
                  courseId={courseId}
                  moduleId={moduleId}
                  onComplete={handleQuizComplete}
                />
              </div>
            )}
            

          </div>
        );
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Lesson Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {(lesson.type === 'video' || lesson.videoUrl) && (
            <div className="flex items-center">
              <Video className="w-4 h-4 mr-1.5" />
              <span>Video{progress.videoCompleted && ' • '}</span>
              {progress.videoCompleted && (
                <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
              )}
            </div>
          )}
          
          {(lesson.type === 'article' || (lesson.content && !lesson.type)) && (
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1.5" />
              <span>Reading Material</span>
            </div>
          )}
          
          {(lesson.type === 'quiz' || (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0)) && (
            <div className="flex items-center">
              <Book className="w-4 h-4 mr-1.5" />
              <span>Quiz{progress.quizCompleted && ' • '}</span>
              {progress.quizCompleted && (
                <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
              )}
            </div>
          )}
          

        </div>
      </div>
      
      {/* Render content based on lesson type */}
      {renderLessonContent()}
      
      {/* Complete button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={() => {
            lessonService.markLessonComplete(courseId, moduleId, lesson._id)
              .then(() => {
                // After marking as complete, refresh the progress
                onComplete && onComplete();
              })
              .catch(err => {
                console.error('Failed to mark lesson as complete:', err);
              });
          }}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Mark as Completed
        </button>
      </div>
    </div>
  );
};

export default LessonContent;