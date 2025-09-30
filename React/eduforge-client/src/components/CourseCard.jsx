import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Star, Clock } from 'lucide-react';
import { getCourseThumbnail, fallbackThumbnail } from '../utils/imageUtils';

const CourseCard = ({ course }) => {
  const { _id, title, description, instructor, thumbnail, duration, rating } = course;
  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : (typeof course.enrolledStudents === 'number' ? course.enrolledStudents : 0);

  return (
    <Link to={`/courses/${_id}`} className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-purple-900/40 transition-shadow duration-300 overflow-hidden transform hover:-translate-y-2">
      <div className="relative">
        <img 
          src={getCourseThumbnail(course)} 
          alt={title} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackThumbnail;
          }}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
        <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {course.category || 'General'}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 truncate">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 h-10 overflow-hidden">{description}</p>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <User className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
          <span>{instructor?.name || 'EduForge Instructor'}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-400" />
              <span>{rating || '4.5'}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" />
              <span>{duration || '6h'}</span>
            </div>
          </div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {enrolledCount > 0 ? `${enrolledCount} enrolled` : 'Join Now'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
