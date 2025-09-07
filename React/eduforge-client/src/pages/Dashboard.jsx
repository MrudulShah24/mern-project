import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { BookOpen, ArrowRight, TrendingUp, Award, CheckCircle, Star } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/50',
      text: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/50',
      text: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/50',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
  };
  const classes = colorClasses[color] || colorClasses.purple;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform hover:scale-105">
      <div className={`${classes.bg} p-3 rounded-full`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${classes.text}` })}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesInProgress: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/enrollments/my-enrollments");
        const validEnrollments = response.data.filter(enrollment => enrollment.course);
        setEnrollments(validEnrollments);

        const inProgress = validEnrollments.filter(e => e.progress < 100).length;
        const completed = validEnrollments.filter(e => e.progress === 100).length;
        
        setStats({
          coursesInProgress: inProgress,
          coursesCompleted: completed,
          certificatesEarned: completed,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mx-auto"></div>
          <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, <span className="text-purple-600 dark:text-purple-400">{user?.name}</span>!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Let's continue your learning journey and achieve your goals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Courses */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Courses</h2>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                {enrollments.map((enrollment) => (
                  <div key={enrollment._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-1/3">
                        <img 
                          className="w-full h-48 sm:h-full object-cover" 
                          src={enrollment.course.thumbnail || 'https://via.placeholder.com/300x200?text=EduForge'} 
                          alt={enrollment.course.title} 
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{enrollment.course.category}</p>
                          <h3 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{enrollment.course.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">By {enrollment.course.instructor.name}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16">
                              <CircularProgressbar
                                value={enrollment.progress}
                                text={`${enrollment.progress}%`}
                                styles={buildStyles({
                                  pathColor: enrollment.progress === 100 ? '#10B981' : '#8B5CF6',
                                  textColor: enrollment.progress === 100 ? '#10B981' : '#8B5CF6',
                                  trailColor: 'rgba(0,0,0,0.1)',
                                })}
                              />
                            </div>
                            {enrollment.progress === 100 && (
                              <div className="flex items-center text-green-500">
                                <CheckCircle className="w-5 h-5 mr-1" />
                                <span className="font-semibold">Completed</span>
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/courses/${enrollment.course._id}`}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105"
                          >
                            {enrollment.progress > 0 ? 'Continue' : 'Start'} <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No Courses Yet</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Your learning adventure starts here. Enroll in a course to begin.</p>
                <Link
                  to="/courses"
                  className="mt-6 inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                >
                  Browse Courses <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar: Stats & Links */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Statistics</h2>
              <div className="space-y-4">
                <StatCard icon={<TrendingUp />} label="In Progress" value={stats.coursesInProgress} color="purple" />
                <StatCard icon={<CheckCircle />} label="Completed" value={stats.coursesCompleted} color="green" />
                <StatCard icon={<Award />} label="Certificates" value={stats.certificatesEarned} color="yellow" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Quick Links</h2>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <ul className="space-y-3">
                  <li><Link to="/courses" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium"><ArrowRight className="w-4 h-4 mr-3 text-purple-500"/>Browse All Courses</Link></li>
                  <li><Link to="/profile" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium"><ArrowRight className="w-4 h-4 mr-3 text-purple-500"/>My Profile</Link></li>
                  <li><Link to="/my-progress" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium"><ArrowRight className="w-4 h-4 mr-3 text-purple-500"/>View My Progress</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
