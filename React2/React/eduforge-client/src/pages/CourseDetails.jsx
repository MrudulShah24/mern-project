import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Clock, Star, Users, Award, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import api from "../utils/axiosConfig";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load course details");
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id]);

  const toggleModule = (moduleId) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Course not found</div>;

  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (typeof course.enrolledStudents === 'number' ? course.enrolledStudents : 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Course Header */}
      <header className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-6 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full">{course.category || 'General'}</span>
              {course.level && <span className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full capitalize">{course.level}</span>}
            </div>
            <h1 className="text-4xl font-extrabold mb-3">{course.title}</h1>
            <p className="text-lg text-white/90 mb-6">{course.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center"><Star className="w-5 h-5 text-yellow-300 mr-2" /><span>{course.rating || 4.5} rating</span></div>
              <div className="flex items-center"><Users className="w-5 h-5 text-emerald-300 mr-2" /><span>{enrolledCount} students</span></div>
              <div className="flex items-center"><Clock className="w-5 h-5 text-blue-200 mr-2" /><span>{course.duration || '6 hours'}</span></div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <img src={course.thumbnail || 'https://via.placeholder.com/400x225'} alt={course.title} className="w-full h-40 object-cover rounded-lg mb-4" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold">${course.price || '49.99'}</span>
                <span className="text-xs text-white/80">Incl. certificate</span>
              </div>
              <button onClick={() => navigate(`/enroll/${course._id}`)} className="w-full bg-white text-purple-700 font-bold py-3 rounded-lg hover:bg-gray-100 transition">Enroll Now</button>
              <p className="text-center text-xs text-white/80 mt-3">30-Day Money-Back Guarantee</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 grid lg:grid-cols-3 gap-12">
        {/* Left Content */}
        <div className="lg:col-span-2">
          {/* What you'll learn */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">What you'll learn</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              {Array.isArray(course.learningObjectives) && course.learningObjectives.length > 0 ? (
                course.learningObjectives.map((obj, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    <span>{obj}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400">No learning objectives specified.</li>
              )}
            </ul>
          </div>

          {/* Course Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Course content</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(course.modules) && course.modules.length > 0 ? (
                course.modules.map(module => (
                  <div key={module._id}>
                    <button onClick={() => toggleModule(module._id)} className="w-full flex justify-between items-center p-6 text-left font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span>{module.title}</span>
                      {openModules[module._id] ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {openModules[module._id] && (
                      <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                        <ul className="space-y-4">
                          {Array.isArray(module.lessons) && module.lessons.length > 0 ? (
                            module.lessons.map(lesson => (
                              <li key={lesson._id} className="flex items-center text-gray-700 dark:text-gray-300">
                                <PlayCircle className="w-5 h-5 text-purple-500 mr-3" />
                                <span>{lesson.title}</span>
                                {lesson.duration && <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{lesson.duration}</span>}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500 dark:text-gray-400">No lessons added yet.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-gray-500 dark:text-gray-400">No modules available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Features) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <h4 className="font-bold mb-3 text-gray-900 dark:text-white">This course includes:</h4>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {course.duration || '6 hours'} on-demand video</li>
                  <li className="flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Articles and resources</li>
                  <li className="flex items-center"><Award className="w-4 h-4 mr-2" /> Certificate of completion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;