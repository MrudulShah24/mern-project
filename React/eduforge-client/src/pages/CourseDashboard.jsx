import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, PlayCircle, FileText, Clock, Star, Award, MessageCircle } from 'lucide-react';
import api from '../utils/axiosConfig';

const CourseDashboard = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
      // Calculate progress
      if (response.data.enrolledStudents) {
        const userProgress = response.data.enrolledStudents.find(
          (student) => student.student === localStorage.getItem('userId')
        );
        if (userProgress) {
          const completed = userProgress.progress.filter((p) => p.completed).length;
          setProgress((completed / response.data.modules.length) * 100);
        }
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course');
      setLoading(false);
    }
  };

  const handleModuleClick = (index) => {
    setActiveModule(index);
    setShowQuiz(false);
  };

  const markModuleComplete = async () => {
    try {
      await api.post(`/courses/${courseId}/modules/${activeModule}/complete`);
      fetchCourseDetails(); // Refresh progress
    } catch (err) {
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
      fetchCourseDetails();
    } catch (err) {
      setError('Failed to submit quiz');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-4">{error}</div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{course.duration} hours</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span>{course.rating.average} ({course.rating.count} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Module Content */}
              {course.modules[activeModule] && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    {course.modules[activeModule].title}
                  </h2>
                  {course.modules[activeModule].videoUrl && (
                    <div className="aspect-w-16 aspect-h-9 mb-6">
                      <iframe
                        src={course.modules[activeModule].videoUrl}
                        className="rounded-lg"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  <div className="prose max-w-none mb-6">
                    {course.modules[activeModule].content}
                  </div>
                  {/* Resources */}
                  {course.modules[activeModule].resources?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Resources</h3>
                      <div className="space-y-2">
                        {course.modules[activeModule].resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            <span>{resource.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="mt-8 flex justify-between items-center">
                    <button
                      onClick={markModuleComplete}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Complete
                    </button>
                    {course.modules[activeModule].quiz?.length > 0 && (
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
              {showQuiz && course.modules[activeModule].quiz && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Module Quiz</h3>
                  {course.modules[activeModule].quiz.map((question, qIdx) => (
                    <div key={qIdx} className="mb-6">
                      <p className="font-medium mb-3">{question.question}</p>
                      <div className="space-y-2">
                        {question.options.map((option, oIdx) => (
                          <label key={oIdx} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              value={oIdx}
                              onChange={() => {
                                const newAnswers = [...quizAnswers];
                                newAnswers[qIdx] = oIdx;
                                setQuizAnswers(newAnswers);
                              }}
                              className="form-radio"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={submitQuiz}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Course Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Your Progress</h3>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="font-semibold mb-4">Course Content</h3>
              <div className="space-y-2">
                {course.modules.map((module, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleModuleClick(idx)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                      activeModule === idx
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full text-sm mr-3">
                        {idx + 1}
                      </span>
                      <span>{module.title}</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
