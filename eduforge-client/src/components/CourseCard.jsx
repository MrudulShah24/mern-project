import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Star, Clock } from 'lucide-react';

const CourseCard = ({ course }) => {
  const { _id, title, description, instructor, thumbnail, duration, rating } = course;
  const enrolledCount = course.enrolledCount || 0;

  return (
    <Link
      to={`/courses/${_id}`}
      className="group glass-card hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(139,92,26,0.08)] dark:hover:shadow-[0_28px_80px_rgba(255,160,70,0.3)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(255,196,120,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,196,120,0.35),_transparent_60%)]" />
      <div className="relative">
        <div className="flex h-24 items-center justify-between border-b border-gray-200/50 dark:border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.05),rgba(245,158,11,0.02))] dark:bg-[linear-gradient(135deg,rgba(255,196,120,0.18),rgba(255,128,80,0.08))] px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-white/10 text-amber-600 dark:text-amber-200 shadow-sm shadow-amber-500/10 dark:shadow-[0_10px_30px_rgba(255,160,70,0.25)]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-800/80 dark:text-amber-200/70">Course</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white/90">{course.level || 'All Levels'}</p>
            </div>
          </div>
          <div className="rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 shadow-sm shadow-amber-500/10 dark:shadow-[0_10px_25px_rgba(255,160,70,0.4)]">
            {course.category || 'General'}
          </div>
        </div>
      </div>
      <div className="relative p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mb-4 h-10 overflow-hidden text-sm text-gray-600 dark:text-gray-300">{description}</p>
        
        <div className="mb-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <User className="mr-2 h-4 w-4 text-amber-500" />
          <span>{instructor?.name || 'EduForge Instructor'}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 text-amber-400" />
              <span>{rating || '4.5'}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <span>{duration || '6h'}</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {enrolledCount > 0 ? `${enrolledCount} enrolled` : 'Join Now'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
