import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Clock, Star, Play, BookOpen, Code } from 'lucide-react';
import api from '../utils/axiosConfig';
import CertificateEligibility from '../components/CertificateEligibility';
import LessonContent from '../components/LessonContent';

const CourseDashboard = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progressPct, setProgressPct] = useState(0);
  const [completedModuleSet, setCompletedModuleSet] = useState(new Set());
    const [completedLessons, setCompletedLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

  useEffect(() => {
      const load = async () => {
        try {
          // First check if user is enrolled
          const enrollmentRes = await api.get(`/enrollments/status/${courseId}`);
          
          if (!enrollmentRes.data.enrolled) {
            setError('You are not enrolled in this course');
            setLoading(false);
            // Redirect to enrollment page after a delay
            setTimeout(() => navigate(`/enroll/${courseId}`), 2000);
            return;
          }
          
          const [courseRes, progressRes] = await Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(`/courses/${courseId}/progress`)
          ]);
          setCourse(courseRes.data);

          const percentage = progressRes.data?.percentage ?? 0;
          setProgressPct(percentage);

          // Handle both formats of progress data
          if (progressRes.data?.progressDetails) {
            const details = Array.isArray(progressRes.data.progressDetails) ? progressRes.data.progressDetails : [];
            const completed = new Set(details.filter(d => d.completed).map(d => d.moduleId));
            setCompletedModuleSet(completed);
          }
          
          if (progressRes.data?.completedLessons) {
            // Convert to strings for easier comparison
            setCompletedLessons(progressRes.data.completedLessons.map(id => id.toString()));
          } else if (progressRes.data?.progressDetails) {
            // Extract completed lessons from progress details
            const completedLessonIds = [];
            progressRes.data.progressDetails.forEach(module => {
              if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach(lesson => {
                  if (lesson.completed && lesson.lessonId) {
                    completedLessonIds.push(lesson.lessonId.toString());
                  }
                });
              }
            });
            setCompletedLessons(completedLessonIds);
          } else {
            setCompletedLessons([]);
          }

          setLoading(false);
        } catch (err) {
          console.error("Error loading course data:", err);
          setError(err.response?.data?.error || 'Failed to load course');
          setLoading(false);
        }
      };
      load();
    }, [courseId, navigate]);  const handleModuleClick = (index) => {
    setActiveModule(index);
    setActiveLesson(null);
  };
  
  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson);
  };

  const refreshProgress = async () => {
    try {
      const progressRes = await api.get(`/courses/${courseId}/progress`);
      const percentage = progressRes.data?.percentage ?? 0;
      setProgressPct(percentage);
      
      // Handle both formats of progress data
      if (progressRes.data?.progressDetails) {
        const details = Array.isArray(progressRes.data.progressDetails) ? progressRes.data.progressDetails : [];
        const completed = new Set(details.filter(d => d.completed).map(d => d.moduleId));
        setCompletedModuleSet(completed);
      }
      
      if (progressRes.data?.completedLessons) {
        // Convert to strings for easier comparison
        setCompletedLessons(progressRes.data.completedLessons.map(id => id.toString()));
      } else if (progressRes.data?.progressDetails) {
        // Extract completed lessons from progress details
        const completedLessonIds = [];
        progressRes.data.progressDetails.forEach(module => {
          if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach(lesson => {
              if (lesson.completed && lesson.lessonId) {
                completedLessonIds.push(lesson.lessonId.toString());
              }
            });
          }
        });
        setCompletedLessons(completedLessonIds);
      } else {
        setCompletedLessons([]);
      }
    } catch (err) {
      console.error("Error refreshing progress:", err);
      // silent fail for UI
    }
  };

  const markModuleComplete = async () => {
    try {
      const response = await api.post(`/courses/${courseId}/modules/${activeModule}/complete`);
      
      // Update the local state with the new progress
      if (response.data.percentage) {
        setProgressPct(response.data.percentage);
      }
      
      if (response.data.progress && Array.isArray(response.data.progress)) {
        // Convert module IDs for matching (they might be strings or numbers)
        const completed = new Set();
        response.data.progress.forEach(item => {
          if (item.completed) {
            const id = typeof item.moduleId === 'object' ? 
              item.moduleId.toString() : 
              (typeof item.moduleId === 'undefined' ? item.toString() : item.moduleId.toString());
            completed.add(id);
          }
        });
        setCompletedModuleSet(completed);
      }
      
      // Always refresh to ensure we have the most up-to-date data
      await refreshProgress();
      
      // Check if course is now completed and generate certificate
      if (response.data.percentage === 100 || response.data.courseProgress === 100) {
        try {
          await api.post(`/certificates/generate/${courseId}`);
          alert('🎉 Congratulations! Course completed and certificate generated!');
        } catch (certErr) {
          console.log('Certificate generation:', certErr.response?.data?.message || 'Already generated');
        }
      }
    } catch (err) {
      console.error('Failed to mark module as complete:', err);
      // Don't show error to user as we don't want to break the UI
      // Just refresh the progress instead
      await refreshProgress();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-purple-600 border-b-purple-600 border-l-gray-200 border-r-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading course content...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Error Loading Course</h2>
        <p className="text-red-500 dark:text-red-400 mb-6">{error}</p>
        <Link to="/dashboard" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
  
  if (!course) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Course Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The course you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );

  // Check if the current module is completed
  const moduleCompleted = course && course.modules && course.modules[activeModule] ? 
    completedModuleSet.has(course.modules[activeModule]._id.toString()) || 
    completedModuleSet.has(activeModule.toString()) : 
    false;

  // If progress is 100%, all modules should be considered completed
  const allModulesCompleted = progressPct >= 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-10 shadow-lg">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-200" />
              <span>{course.duration || '6'} hours</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-300" />
              <span>{course.rating?.average || course.rating || '4.5'}</span>
            </div>
            <div className="flex items-center">
              <div className="bg-purple-500/30 rounded-full px-4 py-1.5">
                <span className="text-sm font-medium">{Math.round(progressPct)}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {/* Module Overview (when no lesson is active) */}
              {course.modules && course.modules[activeModule] && !activeLesson && (
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-semibold mb-4">
                    {course.modules[activeModule].title}
                  </h2>
                  {course.modules[activeModule].videoUrl && (
                    <div className="aspect-w-16 aspect-h-9 mb-6">
                      <iframe
                        src={course.modules[activeModule].videoUrl}
                        className="rounded-lg w-full h-full"
                        allowFullScreen
                        title="module-video"
                      ></iframe>
                    </div>
                  )}
                  <div className="prose max-w-none mb-6">
                    {course.modules[activeModule].content}
                  </div>
                  
                  {/* Lessons List */}
                  {course.modules[activeModule].lessons && Array.isArray(course.modules[activeModule].lessons) && course.modules[activeModule].lessons.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Lessons</h3>
                      <div className="space-y-3">
                        {course.modules[activeModule].lessons.map((lesson, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleLessonClick(lesson)}
                            className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center">
                              {lesson.type === 'video' && <Play className="w-5 h-5 mr-3 text-blue-500" />}
                              {lesson.type === 'article' && <FileText className="w-5 h-5 mr-3 text-green-500" />}
                              {lesson.type === 'quiz' && <BookOpen className="w-5 h-5 mr-3 text-purple-500" />}
                              {lesson.type === 'code' && <Code className="w-5 h-5 mr-3 text-orange-500" />}
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                            <div className="flex items-center">
                              {lesson._id && completedLessons.includes(lesson._id.toString()) && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full mr-2">
                                  Completed
                                </span>
                              )}
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap gap-3 items-center">
                    {!allModulesCompleted && (
                      <button
                        onClick={markModuleComplete}
                        disabled={moduleCompleted || allModulesCompleted}
                        className={`px-6 py-2 rounded-lg text-white ${
                          moduleCompleted || allModulesCompleted 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {moduleCompleted ? 'Completed' : 'Mark as Complete'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Active Lesson Content */}
              {activeLesson && (
                <div className="p-6 md:p-8">
                  <button 
                    onClick={() => setActiveLesson(null)}
                    className="mb-4 flex items-center text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                    Back to Module
                  </button>
                  
                  <LessonContent 
                    lesson={activeLesson} 
                    courseId={courseId}
                    moduleId={course.modules[activeModule]._id}
                    onComplete={refreshProgress}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Course Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Your Progress</h3>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                    {Math.round(progressPct)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Course Content</h3>
              <div className="space-y-2">
                {course.modules && Array.isArray(course.modules) && course.modules.map((module, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleModuleClick(idx)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                      activeModule === idx 
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-sm' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mr-3 ${
                        completedModuleSet.has(idx) 
                          ? 'bg-green-100 dark:bg-green-900/70 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="line-clamp-1">{module.title}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Certificate Eligibility Component */}
            <div>
              <CertificateEligibility courseId={courseId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
