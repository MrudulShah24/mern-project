import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import CourseCard from "../components/CourseCard";
import { Search, SlidersHorizontal } from "lucide-react";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    level: "all",
    rating: "all",
  });

  useEffect(() => {
    api.get("/courses")
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredCourses = courses
    .filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(course => filters.category === 'all' || course.category === filters.category)
    .filter(course => filters.level === 'all' || course.level === filters.level)
    .filter(course => filters.rating === 'all' || (course.rating && course.rating >= parseInt(filters.rating)));

  // Group courses by level
  const coursesByLevel = {
    Beginner: filteredCourses.filter(course => course.level === 'Beginner'),
    Intermediate: filteredCourses.filter(course => course.level === 'Intermediate'),
    Advanced: filteredCourses.filter(course => course.level === 'Advanced'),
    Uncategorized: filteredCourses.filter(course => !course.level)
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            All Courses
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Find your next learning adventure.
          </p>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100" onChange={(e) => setFilters({...filters, category: e.target.value})}>
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
          <select className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100" onChange={(e) => setFilters({...filters, level: e.target.value})}>
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Course Grid - Organized by Level */}
      <main className="container mx-auto px-6 pb-20">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading courses...</div>
        ) : (
          <>
            {/* Only show sections that have courses */}
            {filters.level === 'all' ? (
              // When no level filter is active, show all levels with section headers
              <>
                {Object.entries(coursesByLevel).map(([level, levelCourses]) => 
                  levelCourses.length > 0 && (
                    <div key={level} className="mb-12">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {level} Courses
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {levelCourses.map((course) => (
                          <CourseCard key={course._id} course={course} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </>
            ) : (
              // When a level filter is active, show just the filtered courses without section header
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            )}

            {filteredCourses.length === 0 && !loading && (
              <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                <h3 className="text-2xl font-semibold">No courses found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CourseList;
