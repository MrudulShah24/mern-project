import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { TrendingUp, Star, Clock, Lightbulb, ArrowUpRight } from 'lucide-react';

const CourseRecommendations = () => {
  const navigate = useNavigate();
  
  const handleCourseClick = (courseId) => {
    window.scrollTo(0, 0);
    navigate(`/courses/${courseId}`);
  };
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    trending: []
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
          trending: response.data.trending || []
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
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center py-8">
          <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/courses');
            }} 
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Recommended For You</h2>
      
      {/* Recommendation Tabs */}
      <div className="flex flex-wrap space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['personalized', 'trending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === tab
                ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
                : 'text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'
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
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300 h-full flex flex-col">
                <div className="relative">
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/300x200?text=EduForge'}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  {course.featured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
                      Featured
                    </div>
                  )}
                  {course.level && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {course.level}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 mr-1" />
                      <span>{course.rating || '4.5'}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration ? `${Math.round(course.duration / 60)}h` : '6h'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{course.category || 'General'}</span>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                    {course.enrolledCount || course.enrolledStudents?.length || 0} students
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
              className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Browse All Courses <ArrowUpRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseRecommendations;