import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Clock, Star } from 'lucide-react';
import api from '../utils/axiosConfig';
import CertificateEligibility from '../components/CertificateEligibility';

const CourseDashboard = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [completedModuleSet, setCompletedModuleSet] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
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

        const details = Array.isArray(progressRes.data?.progressDetails) ? progressRes.data.progressDetails : [];
        const completed = new Set(details.filter(d => d.completed).map(d => d.moduleId));
        setCompletedModuleSet(completed);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load course');
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  const handleModuleClick = (index) => {
    setActiveModule(index);
    setShowQuiz(false);
  };

  const refreshProgress = async () => {
    try {
      const progressRes = await api.get(`/courses/${courseId}/progress`);
      const percentage = progressRes.data?.percentage ?? 0;
      setProgressPct(percentage);
      const details = Array.isArray(progressRes.data?.progressDetails) ? progressRes.data.progressDetails : [];
      const completed = new Set(details.filter(d => d.completed).map(d => d.moduleId));
      setCompletedModuleSet(completed);
    } catch (err) {
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
      
      if (response.data.progress) {
        const completed = new Set(response.data.progress.filter(p => p.completed).map(p => p.moduleId));
        setCompletedModuleSet(completed);
      } else {
        // Fallback to refresh
        await refreshProgress();
      }
      
      // Check if course is now completed and generate certificate
      if (response.data.percentage === 100) {
        try {
          await api.post(`/certificates/generate/${courseId}`);
          alert('🎉 Congratulations! Course completed and certificate generated!');
        } catch (certErr) {
          console.log('Certificate generation:', certErr.response?.data?.message || 'Already generated');
        }
      }
    } catch (err) {
      console.error('Failed to mark module as complete:', err);
      setError('Failed to mark module as complete');
    }
  };

  const submitQuiz = async () => {
    try {
      const response = await api.post(
        `/courses/${courseId}/modules/${activeModule}/quiz/attempt`,
        { answers: quizAnswers }
      );
      alert(`Quiz Score: ${response.data.score}%`);
      await refreshProgress();
    } catch (err) {
      setError('Failed to submit quiz');
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

  const moduleCompleted = completedModuleSet.has(activeModule);

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
              {/* Module Content */}
              {course.modules[activeModule] && (
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
                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap gap-3 items-center">
                    <button
                      onClick={markModuleComplete}
                      disabled={moduleCompleted}
                      className={`px-6 py-2 rounded-lg text-white ${moduleCompleted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {moduleCompleted ? 'Completed' : 'Mark as Complete'}
                    </button>
                    {Array.isArray(course.modules[activeModule].quiz) && course.modules[activeModule].quiz.length > 0 && (
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz Section */}
              {showQuiz && Array.isArray(course.modules[activeModule].quiz) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8">
                  <h3 className="text-xl font-semibold mb-6 text-purple-700 dark:text-purple-400">Module Quiz</h3>
                  {course.modules[activeModule].quiz.map((question, qIdx) => (
                    <div key={qIdx} className="mb-8 border-b pb-6 border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                      <p className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md mr-2">Q{qIdx + 1}</span>
                        {question.question}
                      </p>
                      <div className="space-y-3 pl-4">
                        {question.options.map((option, oIdx) => (
                          <label key={oIdx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              value={oIdx}
                              onChange={() => {
                                const newAnswers = [...quizAnswers];
                                newAnswers[qIdx] = oIdx;
                                setQuizAnswers(newAnswers);
                              }}
                              className="form-radio h-5 w-5 text-purple-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={submitQuiz}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Submit Quiz
                  </button>
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
                {course.modules.map((module, idx) => (
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
