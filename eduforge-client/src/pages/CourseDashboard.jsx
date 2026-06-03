import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Clock, Star, Play, BookOpen, Code, CheckCircle, Layers } from 'lucide-react';
import api from '../utils/axiosConfig';
import CertificateEligibility from '../components/CertificateEligibility';
import LessonContent from '../components/LessonContent';

const CourseDashboard = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
      const load = async () => {
        try {
          const enrollmentRes = await api.get(`/enrollments/status/${courseId}`);
          if (!enrollmentRes.data.enrolled) {
            setError('You are not enrolled in this course');
            setLoading(false);
            setTimeout(() => navigate(`/enroll/${courseId}`), 2000);
            return;
          }
          setEnrollment(enrollmentRes.data.enrollment);
          const courseRes = await api.get(`/courses/${courseId}`);
          setCourse(courseRes.data);
          setLoading(false);
        } catch (err) {
          console.error("Error loading course data:", err);
          setError(err.response?.data?.error || 'Failed to load course');
          setLoading(false);
        }
      };
      load();
    }, [courseId, navigate]);

  const handleLessonComplete = async () => {
    try {
      const enrollmentRes = await api.get(`/enrollments/status/${courseId}`);
      if (enrollmentRes.data.enrolled) {
        setEnrollment(enrollmentRes.data.enrollment);
      }
    } catch (err) {
      console.error("Failed to update enrollment progress:", err);
    }
  };

  const getModuleProgress = (moduleId) => {
    if (!enrollment || !enrollment.progress) return null;
    return enrollment.progress.find(p => p.moduleId.toString() === moduleId.toString());
  };
  
  const isModuleCompleted = (moduleId) => {
    const prog = getModuleProgress(moduleId);
    return prog ? prog.completed : false;
  };

  const isLessonCompleted = (moduleId, lessonId) => {
    if (!enrollment || !enrollment.progress) return false;
    const modProg = enrollment.progress.find(p => p.moduleId.toString() === moduleId.toString());
    if (!modProg || !modProg.lessons) return false;
    const lesProg = modProg.lessons.find(l => l.lessonId.toString() === lessonId.toString());
    return lesProg ? lesProg.completed : false;
  };

  const handleModuleClick = (index) => {
    setActiveModule(index);
    setActiveLesson(null);
  };
  
  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-transparent">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-amber-500 border-b-amber-500 border-l-amber-500/20 border-r-amber-500/20 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-slate-400 font-medium">Loading course content...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-transparent">
      <div className="glass-panel p-8 shadow-2xl max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Course</h2>
        <p className="text-red-500 dark:text-red-400 mb-6 font-medium">{error}</p>
        <Link to="/dashboard" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition text-white font-bold rounded-xl inline-block shadow-sm">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
  
  if (!course) return (
    <div className="flex justify-center items-center h-screen bg-transparent">
      <div className="glass-panel p-8 shadow-2xl max-w-md text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">The course you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 transition text-white font-bold rounded-xl inline-block shadow-sm">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent">

      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-500/4 rounded-full blur-3xl" />
      </div>

      {/* Course Header */}
      <div className="relative overflow-hidden border-b border-amber-100/60 dark:border-amber-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.06),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.03),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md" />
        
        <div className="relative container mx-auto px-4 md:px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link to="/dashboard" className="hover:text-amber-400 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-400/80 truncate max-w-[200px]">{course.title}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">{course.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white/5 border border-amber-500/20 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-sm">{course.duration || '6'} hours</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-amber-500/20 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="text-slate-300 text-sm">{course.rating?.average || course.rating || '4.5'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-amber-500/20 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-sm">{course.modules?.length || 0} modules</span>
            </div>
            {enrollment && (
              <div className="flex items-center gap-3 bg-white/5 border border-amber-500/20 rounded-full px-4 py-1.5 backdrop-blur-sm ml-auto">
                <div className="w-28 bg-slate-950/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${enrollment.progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {enrollment.progressPercentage}% Complete
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Module Overview */}
            {course.modules && course.modules[activeModule] && !activeLesson && (
              <div className="glass-panel shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.02),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.06),_transparent_60%)] pointer-events-none" />
                
                {/* Module header strip */}
                <div className="border-b border-amber-100/40 dark:border-amber-500/15 px-8 py-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md text-white font-bold text-sm">
                    {activeModule + 1}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {course.modules[activeModule].title}
                  </h2>
                </div>

                <div className="p-8">
                  {course.modules[activeModule].videoUrl && (
                    <div className="aspect-video mb-6 rounded-2xl overflow-hidden border border-amber-100/60 dark:border-amber-500/15 shadow-md">
                      <iframe
                        src={course.modules[activeModule].videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="module-video"
                      />
                    </div>
                  )}
                  
                  {course.modules[activeModule].content && (
                    <div className="prose dark:prose-invert prose-amber max-w-none mb-6 text-gray-800 dark:text-slate-300">
                      {course.modules[activeModule].content}
                    </div>
                  )}

                  {/* Lessons List */}
                  {course.modules[activeModule].lessons &&
                   Array.isArray(course.modules[activeModule].lessons) &&
                   course.modules[activeModule].lessons.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">Lessons in this module</h3>
                      <div className="space-y-2.5">
                        {course.modules[activeModule].lessons.map((lesson, idx) => {
                          const completed = isLessonCompleted(course.modules[activeModule]._id, lesson._id);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleLessonClick(lesson)}
                              className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                                completed
                                  ? 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10'
                                  : 'border-amber-100/60 dark:border-amber-500/20 bg-white/30 dark:bg-white/3 hover:bg-amber-500/5 dark:hover:bg-white/8 hover:border-amber-500/35 dark:hover:border-amber-400/40 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Lesson type icon */}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  completed ? 'bg-emerald-500/15' : 'bg-amber-500/10 dark:bg-white/5 border border-amber-500/10'
                                }`}>
                                  {lesson.type === 'video' && <Play className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                                  {lesson.type === 'article' && <FileText className="w-4 h-4 text-emerald-550 dark:text-emerald-400" />}
                                  {lesson.type === 'quiz' && <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                                  {lesson.type === 'code' && <Code className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
                                  {!lesson.type && <FileText className="w-4 h-4 text-slate-500 dark:text-slate-455" />}
                                </div>
                                <div>
                                  <span className={`font-semibold block ${completed ? 'text-gray-450 dark:text-slate-450' : 'text-gray-900 dark:text-slate-200'}`}>
                                    {lesson.title}
                                  </span>
                                  {lesson.duration && (
                                    <span className="text-xs text-gray-500 dark:text-slate-500">{lesson.duration} min</span>
                                  )}
                                </div>
                              </div>
                              {completed ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Lesson Content */}
            {activeLesson && (
              <div className="glass-panel shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.02),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.05),_transparent_60%)] pointer-events-none" />
                <div className="px-8 py-5 border-b border-amber-100/40 dark:border-amber-500/15">
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors text-sm"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Module
                  </button>
                </div>
                <div className="p-8">
                  <LessonContent
                    lesson={activeLesson}
                    courseId={courseId}
                    moduleId={course.modules[activeModule]._id}
                    onComplete={handleLessonComplete}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Course Content Navigation */}
            <div className="glass-panel shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.02),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.06),_transparent_60%)] pointer-events-none" />
              <div className="px-5 py-4 border-b border-amber-100/40 dark:border-amber-500/15">
                <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest">Course Content</h3>
              </div>
              <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar">
                {course.modules && Array.isArray(course.modules) && course.modules.map((module, idx) => {
                  const completed = isModuleCompleted(module._id);
                  const isActive = activeModule === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleModuleClick(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border border-transparent hover:bg-amber-500/5 dark:hover:bg-white/5 text-gray-500 dark:text-slate-450 hover:text-gray-950 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        completed
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-amber-500 text-white dark:text-slate-900'
                          : 'bg-amber-500/10 dark:bg-white/10 text-amber-600 dark:text-slate-400'
                      }`}>
                        {completed ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold leading-snug flex-1">{module.title}</span>
                      {!completed && <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Certificate Eligibility */}
            <CertificateEligibility courseId={courseId} enrollment={enrollment} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
