import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../utils/axiosConfig';
import CourseCard from '../components/CourseCard';

const Home = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/courses?limit=6')
      .then(res => setCourses(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90"></div>
        <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
            Unlock Your Potential.
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-200">
            Join thousands of learners on EduForge and take the next step in your career with our expert-led courses.
          </p>
          <div className="flex justify-center">
            <Link
              to="/courses"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Featured Courses</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Handpicked courses to get you started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/courses" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition">
              View All Courses <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Why EduForge?</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">A better learning experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 p-4 rounded-full mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Expert Instructors</h3>
              <p className="text-gray-600 dark:text-gray-400">Learn from industry experts who are passionate about teaching.</p>
            </div>
            <div className="p-6">
              <div className="inline-block bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-4 rounded-full mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 0H4v8h12V6z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Flexible Learning</h3>
              <p className="text-gray-600 dark:text-gray-400">Learn at your own pace, anytime, anywhere.</p>
            </div>
            <div className="p-6">
              <div className="inline-block bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 p-4 rounded-full mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Career-Oriented</h3>
              <p className="text-gray-600 dark:text-gray-400">Gain skills that are in-demand and boost your career.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
