import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, Clock, Star, Users, Award, Brain, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import api from "../utils/axiosConfig";

const CourseDetails = () => {
  const { id } = useParams();
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

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Course not found</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Course Header */}
      <header className="bg-gray-800 dark:bg-gray-950 text-white py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <h1 className="text-4xl font-extrabold mb-2">{course.title}</h1>
            <p className="text-xl text-gray-300 dark:text-gray-400 mb-4">{course.description}</p>
            <div className="flex items-center space-x-4 mb-4 text-gray-300 dark:text-gray-400">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span>{course.rating || 4.5} (1,234 ratings)</span>
              </div>
              <span>{course.enrolledStudents || 0} students</span>
            </div>
            <p className="text-gray-200">Created by <span className="font-semibold text-white">{course.instructor?.name}</span></p>
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
              {course.learningObjectives?.map((obj, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  <span>{obj}</span>
                </li>
              )) || <p>No learning objectives specified.</p>}
            </ul>
          </div>

          {/* Course Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Course content</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
              {course.modules?.map(module => (
                <div key={module._id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <button onClick={() => toggleModule(module._id)} className="w-full flex justify-between items-center p-6 text-left font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span>{module.title}</span>
                    {openModules[module._id] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {openModules[module._id] && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                      <ul className="space-y-4">
                        {module.lessons?.map(lesson => (
                          <li key={lesson._id} className="flex items-center text-gray-700 dark:text-gray-300">
                            <PlayCircle className="w-5 h-5 text-purple-500 mr-3" />
                            <span>{lesson.title}</span>
                            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{lesson.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Other sections like reviews, discussions can be added here */}
        </div>

        {/* Right Sidebar (Floating Card) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <img src={course.thumbnail || 'https://via.placeholder.com/400x225'} alt={course.title} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">${course.price || '49.99'}</h3>
                <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition">
                  Enroll Now
                </button>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">30-Day Money-Back Guarantee</p>
                <div className="mt-6">
                  <h4 className="font-bold mb-2 text-gray-900 dark:text-white">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {course.duration || '6 hours'} on-demand video</li>
                    <li className="flex items-center"><BookOpen className="w-4 h-4 mr-2" /> 12 articles</li>
                    <li className="flex items-center"><Award className="w-4 h-4 mr-2" /> Certificate of completion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;