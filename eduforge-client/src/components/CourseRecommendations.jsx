import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { TrendingUp, Star, Clock, Lightbulb, ArrowUpRight } from 'lucide-react';
import { getCourseThumbnail, fallbackThumbnail } from '../utils/imageUtils';

const CourseRecommendations = () => {
  const navigate = useNavigate();
  
  const handleCourseClick = (courseId) => {
    window.scrollTo(0, 0);
    navigate(`/courses/${courseId}`);
  };
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    trending: [],
    isEnrolledInAllCourses: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personalized');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        console.log('Fetching course recommendations...');
        setLoading(true);
        const response = await api.get('/recommendations');
        console.log('Recommendations data:', response.data);
        
        // Only use personalized and trending recommendations
        const filteredData = {
          personalized: response.data.personalized || [],
          trending: response.data.trending || [],
          isEnrolledInAllCourses: response.data.isEnrolledInAllCourses || false
        };
        
        setRecommendations(filteredData);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const getCoursesToDisplay = () => {
    switch (activeTab) {
      case 'personalized':
        return recommendations.personalized || [];
      case 'trending':
        return recommendations.trending || [];
      default:
        return recommendations.personalized || [];
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'personalized':
        return <Lightbulb className="w-4 h-4 mr-1" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'personalized':
        return 'For You';
      case 'trending':
        return 'Trending';
      default:
        return '';
    }
  };

  const getEmptyMessage = (tab) => {
    switch (tab) {
      case 'personalized':
        return 'No personalized recommendations available yet. You are already enrolled in all available courses!';
      case 'trending':
        return 'No trending courses available at the moment. You are already enrolled in all available courses!';
      default:
        return 'No courses found in this category. You are already enrolled in all available courses!';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6">
        <div className="text-center py-8">
          <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/courses');
            }} 
            className="inline-block rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-6 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(255,160,70,0.35)] transition hover:brightness-105">
            Browse All Courses
          </button>
        </div>
      </div>
    );
  }

  const availableTabs = [
    { id: 'personalized', hasData: recommendations.personalized?.length > 0 },
    { id: 'trending', hasData: recommendations.trending?.length > 0 }
  ].filter(tab => tab.hasData);

  // If current tab has no data, default to first available tab
  if (availableTabs.length > 0 && !recommendations[activeTab]?.length) {
    setTimeout(() => setActiveTab(availableTabs[0].id), 0);
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Recommended For You</h2>
      
      {/* Recommendation Tabs */}
      <div className="flex flex-wrap space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['personalized', 'trending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === tab
                ? 'text-amber-600 border-b-2 border-amber-500 dark:text-amber-400 dark:border-amber-400'
                : 'text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400'
            }`}
          >
            {getTabIcon(tab)}
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {getCoursesToDisplay().length > 0 ? (
          getCoursesToDisplay().map((course) => (
            <div key={course._id} 
                 onClick={() => handleCourseClick(course._id)} 
                 className="group cursor-pointer">
              <div className="glass-card hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(255,160,70,0.28)]">
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(255,196,120,0.35),_transparent_60%)]" />
                <div className="flex h-20 items-center justify-between border-b border-gray-200/50 dark:border-amber-500/20 bg-[linear-gradient(135deg,rgba(255,196,120,0.18),rgba(255,128,80,0.08))] px-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-amber-800/80 dark:text-amber-200/70">Featured</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white/90">{course.level || 'All Levels'}</p>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 shadow-[0_10px_20px_rgba(255,160,70,0.35)]">
                    {course.category || 'General'}
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-800 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-4 h-4 mr-1" />
                      <span>{course.rating || '4.5'}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration ? `${Math.round(course.duration / 60)}h` : '6h'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-amber-50/80 px-4 py-2 dark:bg-slate-900/70">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{course.category || 'General'}</span>
                  <span className="rounded-full bg-amber-100/80 px-2 py-1 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                    {course.enrolledCount || 0} students
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {recommendations.isEnrolledInAllCourses 
                ? 'Congratulations! You are enrolled in all available courses.' 
                : getEmptyMessage(activeTab)}
            </div>
            <button 
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/courses');
              }}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold rounded-lg hover:brightness-105 shadow-md">
              Browse All Courses <ArrowUpRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseRecommendations;
