import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Clock, Star, Users, Award, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import api from "../utils/axiosConfig";
import CourseRating from "../components/CourseRating";
import CourseRecommendations from "../components/CourseRecommendations";

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

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Error Loading Course</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || "Course data not available"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const calculateTotalHours = () => {
    let totalMinutes = 0;
    
    if (course && course.modules) {
      course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach(lesson => {
            totalMinutes += lesson.duration || 0;
          });
        }
      });
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const handleEnroll = () => {
    navigate(`/enroll/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Course Banner */}
      <div 
        className="relative bg-cover bg-center h-80 flex items-center justify-center"
        style={{ backgroundImage: `url(${course.bannerImage || '/images/placeholders/default-banner.svg'})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {course.title}
          </h1>
          <p className="text-xl text-gray-200 mb-6 max-w-3xl">
            {course.subtitle || "A comprehensive learning experience"}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-white">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <span>{course.rating ? course.rating.toFixed(1) : '0.0'} ({course.reviewCount || 0} reviews)</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-1" />
              <span>{course.enrollmentCount || 0} students</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-1" />
              <span>{calculateTotalHours()}</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-1" />
              <span>{course.modules && course.modules.length > 0 ? course.modules.reduce((acc, module) => acc + (module.lessons ? module.lessons.length : 0), 0) : 0} lessons</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Course Details */}
          <div className="col-span-2 space-y-10">
            {/* About This Course */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Course</h2>
              <div className="prose prose-purple dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
              </div>
            </section>

            {/* What You'll Learn */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                  course.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex">
                      <span className="text-purple-600 mr-3">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 col-span-2">
                    Learning outcomes not specified for this course.
                  </div>
                )}
              </div>
            </section>

            {/* Course Content */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Content</h2>
              <div className="text-gray-500 dark:text-gray-400 mb-6">
                {course.modules && course.modules.length > 0 ? 
                  `${course.modules.length} modules • ${course.modules.reduce((acc, module) => acc + (module.lessons ? module.lessons.length : 0), 0)} lessons • ${calculateTotalHours()} total`
                  : 'No content available yet'}
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {course.modules && course.modules.length > 0 ? (
                  course.modules.map((module) => (
                    <div key={module._id} className="py-4">
                      <button 
                        className="w-full flex justify-between items-center text-left" 
                        onClick={() => toggleModule(module._id)}
                      >
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {module.title}
                        </h3>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                            {module.lessons && module.lessons.length > 0 ? `${module.lessons.length} lessons` : 'No lessons'}
                          </span>
                          {openModules[module._id] ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                      </button>
                      
                      {openModules[module._id] && module.lessons && module.lessons.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2">
                          {module.lessons.map((lesson) => (
                            <div key={lesson._id} className="flex items-center py-2">
                              <PlayCircle className="w-5 h-5 text-gray-400 mr-2" />
                              <span className="text-gray-700 dark:text-gray-300 flex-1">
                                {lesson.title}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-gray-500 dark:text-gray-400">
                    No modules available for this course yet. Please check back later.
                  </div>
                )}
              </div>
            </section>
            
            {/* Instructor Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Instructor</h2>
              {course.instructor ? (
                <div className="flex items-start space-x-4">
                  <img 
                    src={course.instructor.avatar || "/images/placeholders/default-avatar.svg"} 
                    alt={course.instructor.name || "Instructor"} 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {course.instructor.name || "Instructor"}
                    </h3>
                    <p className="text-purple-600 dark:text-purple-400 mb-2">
                      {course.instructor.title || "Course Instructor"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {course.instructor.bio || "No bio available."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  Instructor information not available.
                </div>
              )}
            </section>
            
            {/* Reviews Section */}
            <section>
              <CourseRating courseId={id} />
            </section>
          </div>
          
          {/* Right Column: Course Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
              <div className="aspect-video rounded-lg overflow-hidden mb-6">
                <img 
                  src={course.thumbnail || "/images/placeholders/default-thumbnail.svg"} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {course.isPremium ? (
                      <>
                        ${course.price ? course.price.toFixed(2) : '0.00'}
                        <span className="text-lg text-gray-500 dark:text-gray-400 line-through ml-2">
                          ${course.price ? (course.price * 1.3).toFixed(2) : '0.00'}
                        </span>
                      </>
                    ) : (
                      "Free"
                    )}
                  </div>
                </div>
                
                {course.isPremium && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="text-green-600 font-medium">30% off</span> - Limited time offer
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleEnroll}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-4"
              >
                {course.isPremium ? "Buy Now" : "Enroll Now"}
              </button>
              
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                30-Day Money-Back Guarantee
              </p>
              
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white">This course includes:</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                    <span>{course.modules && course.modules.length > 0 ? 
                      course.modules.reduce((acc, module) => acc + (module.lessons ? module.lessons.length : 0), 0) 
                      : 0} lessons</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    <span>{calculateTotalHours()} of video content</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Award className="w-5 h-5 mr-2 text-purple-600" />
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Courses Section */}
      <div className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You Might Also Like</h2>
        <CourseRecommendations />
      </div>
    </div>
  );
};

export default CourseDetails;