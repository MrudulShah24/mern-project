import React from 'react';
import { Star, BookOpen, Zap, Award, Shield } from 'lucide-react';

const badgeData = [
  {
    id: 'pioneer',
    name: 'Course Pioneer',
    description: 'Complete your first course.',
    icon: <Star className="w-10 h-10 text-yellow-400" />,
    criteria: (completedCourses) => completedCourses.length >= 1,
  },
  {
    id: 'serial-learner',
    name: 'Serial Learner',
    description: 'Complete 5 courses.',
    icon: <BookOpen className="w-10 h-10 text-blue-500" />,
    criteria: (completedCourses) => completedCourses.length >= 5,
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Complete a course within 3 days of enrolling.',
    icon: <Zap className="w-10 h-10 text-green-500" />,
    criteria: (completedCourses) => completedCourses.some(course => {
        const enrollmentDate = new Date(course.enrollmentDate);
        const completionDate = new Date(course.completionDate);
        const diffTime = Math.abs(completionDate - enrollmentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    }),
  },
  {
    id: 'top-performer',
    name: 'Top Performer',
    description: 'Achieve a score of 90% or higher on a quiz.',
    icon: <Award className="w-10 h-10 text-red-500" />,
    criteria: (completedCourses) => completedCourses.some(course => course.quizScore && course.quizScore >= 90),
  },
  {
    id: 'topic-master',
    name: 'Topic Master',
    description: 'Complete all courses in a specific category.',
    icon: <Shield className="w-10 h-10 text-purple-500" />,
    criteria: (completedCourses, allCourses) => {
        const categories = [...new Set(allCourses.map(c => c.category))];
        return categories.some(category => {
            const categoryCourses = allCourses.filter(c => c.category === category);
            const completedCategoryCourses = completedCourses.filter(c => c.category === category);
            return categoryCourses.length > 0 && categoryCourses.length === completedCategoryCourses.length;
        });
    }
  }
];

const Badge = ({ badge, earned }) => (
  <div className={`relative flex flex-col items-center p-4 border rounded-lg transition-all duration-300 ${earned ? 'bg-white dark:bg-gray-800 shadow-lg transform hover:-translate-y-1' : 'bg-gray-100 dark:bg-gray-700/50 filter grayscale opacity-60'}`}>
    <div className="mb-2">{badge.icon}</div>
    <h3 className="text-md font-bold text-gray-800 dark:text-gray-200">{badge.name}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{badge.description}</p>
    {earned && (
      <div className="absolute -top-2 -right-2">
        <span className="flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 items-center justify-center">
             <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </span>
        </span>
      </div>
    )}
  </div>
);

const Achievements = ({ completedCourses = [], allCourses = [] }) => {
  const earnedBadges = badgeData.filter(badge => badge.criteria(completedCourses, allCourses));
  const unearnedBadges = badgeData.filter(badge => !badge.criteria(completedCourses, allCourses));

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl shadow-inner">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Achievements & Badges</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {earnedBadges.map(badge => (
          <Badge key={badge.id} badge={badge} earned={true} />
        ))}
        {unearnedBadges.map(badge => (
          <Badge key={badge.id} badge={badge} earned={false} />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
