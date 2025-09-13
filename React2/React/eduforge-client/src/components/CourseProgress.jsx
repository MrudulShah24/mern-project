import React, { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CheckCircle, Circle, PlayCircle, ChevronDown } from 'lucide-react';

const CourseProgress = ({ modules, progress, onLessonClick }) => {
  const [openModule, setOpenModule] = useState(modules?.[0]?._id || null);

  const totalLessons = modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const completedLessons = progress?.completedLessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const toggleModule = (moduleId) => {
    setOpenModule(openModule === moduleId ? null : moduleId);
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Course Progress</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Overall Progress Circle */}
        <div className="md:col-span-1 flex flex-col items-center justify-center border-r-0 md:border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-8">
          <div className="w-40 h-40">
            <CircularProgressbar
              value={progressPercentage}
              text={`${progressPercentage}%`}
              styles={buildStyles({
                pathColor: '#7C3AED',
                textColor: '#7C3AED',
                trailColor: '#E5E7EB'
              })}
              className="dark-progress" // For dark mode overrides in index.css
            />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            <span className="font-bold text-gray-800 dark:text-gray-200">{completedLessons}</span> of <span className="font-bold text-gray-800 dark:text-gray-200">{totalLessons}</span> lessons completed
          </p>
        </div>

        {/* Module Progress Accordion */}
        <div className="md:col-span-2 space-y-3">
          {modules?.length > 0 ? modules.map((module, index) => {
            const moduleCompletedLessons = module.lessons?.filter(lesson => 
              progress?.completedLessons?.includes(lesson._id)
            ).length || 0;
            
            const moduleProgress = module.lessons?.length 
              ? Math.round((moduleCompletedLessons / module.lessons.length) * 100)
              : 0;
            
            const isOpen = openModule === module._id;

            return (
              <div key={module._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module._id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Module {index + 1}: {module.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{moduleCompletedLessons} / {module.lessons?.length} lessons</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{moduleProgress}%</span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Lessons List (Collapsible) */}
                {isOpen && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="space-y-2">
                      {module.lessons?.map(lesson => {
                        const isCompleted = progress?.completedLessons?.includes(lesson._id);
                        const isCurrentLesson = progress?.currentLesson === lesson._id;

                        return (
                          <button
                            key={lesson._id}
                            onClick={() => onLessonClick && onLessonClick(lesson._id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${
                              isCurrentLesson ? 'bg-purple-50 dark:bg-purple-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                              ) : isCurrentLesson ? (
                                <PlayCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0" />
                              )}
                              <span className={`
                                ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}
                                ${isCurrentLesson ? 'font-semibold' : ''}
                              `}>
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {lesson.duration}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No modules available for this course.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;
