import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { BookOpen, ArrowRight, TrendingUp, Award, CheckCircle, Star } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import CourseRecommendations from "../components/CourseRecommendations";

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    amber: {
      bg: 'bg-amber-100/80 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-300',
    },
    green: {
      bg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-300',
    },
    yellow: {
      bg: 'bg-orange-100/80 dark:bg-orange-500/15',
      text: 'text-orange-600 dark:text-orange-300',
    },
  };
  const classes = colorClasses[color] || colorClasses.amber;

  return (
    <div className="glass-panel p-6 flex items-center space-x-4 transition-transform hover:scale-105">
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
  const [courseProgress, setCourseProgress] = useState({}); // courseId -> progress data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesInProgress: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data for user:', user?.name, 'with ID:', user?._id);
        
        // Get enrollments first
        const enrollmentsRes = await api.get("/enrollments/my-enrollments");
        console.log('Raw enrollments data:', enrollmentsRes.data);
        
        const validEnrollments = enrollmentsRes.data.filter(enrollment => enrollment.course);
        console.log('Valid enrollments after filtering:', validEnrollments.length);
        
        setEnrollments(validEnrollments);

        // Fetch progress for each enrolled course
        const progressPromises = validEnrollments.map(async (enrollment) => {
          try {
            const progressRes = await api.get(`/courses/${enrollment.course._id}/progress`);
            return {
              courseId: enrollment.course._id,
              progress: progressRes.data
            };
          } catch (err) {
            console.error(`Failed to fetch progress for course ${enrollment.course._id}:`, err);
            return {
              courseId: enrollment.course._id,
              progress: { percentage: 0, completedModules: 0, totalModules: 0 }
            };
          }
        });

        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        progressResults.forEach(({ courseId, progress }) => {
          progressMap[courseId] = progress;
        });
        setCourseProgress(progressMap);

        // Calculate stats from actual course progress
        const inProgress = progressResults.filter(p => p.progress.percentage > 0 && p.progress.percentage < 100).length;
        const completed = progressResults.filter(p => p.progress.percentage === 100).length;
        
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
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-400 mx-auto"></div>
          <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, <span className="text-amber-600 dark:text-amber-300">{user?.name}</span>!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Let's continue your learning journey and achieve your goals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Courses */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Courses</h2>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                {enrollments.map((enrollment) => {
                  const progress = courseProgress[enrollment.course._id] || { percentage: 0 };
                  return (
                    <div key={enrollment._id} className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_24px_70px_rgba(245,158,11,0.12)] hover:border-amber-400/45 dark:hover:border-amber-500/40 group">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        <div className="hidden sm:flex sm:w-1/4 bg-amber-50/50 dark:bg-slate-900/40 border-r border-amber-200 dark:border-amber-500/10 items-center justify-center p-6 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.08),_transparent_70%)] pointer-events-none" />
                          <div className="relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_8px_16px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform duration-500">
                            <BookOpen className="w-8 h-8 text-amber-500" />
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm text-amber-600 dark:text-amber-300 font-semibold">{enrollment.course.category}</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{enrollment.course.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">By {enrollment.course.instructor.name}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-16 h-16">
                                <CircularProgressbar
                                  value={progress.percentage}
                                  text={`${Math.round(progress.percentage)}%`}
                                  styles={buildStyles({
                                    pathColor: progress.percentage === 100 ? '#10B981' : '#f59e0b',
                                    textColor: progress.percentage === 100 ? '#10B981' : '#f59e0b',
                                    trailColor: 'rgba(0,0,0,0.1)',
                                  })}
                                />
                              </div>
                              {progress.percentage === 100 && (
                                <div className="flex items-center text-green-500">
                                  <CheckCircle className="w-5 h-5 mr-1" />
                                  <span className="font-semibold">Completed</span>
                                </div>
                              )}
                            </div>
                            <Link
                              to={`/course-dashboard/${enrollment.course._id}`}
                              className="flex items-center rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(255,160,70,0.35)] transition-transform transform hover:scale-105"
                            >
                              {progress.percentage > 0 ? 'Continue' : 'Start'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-6 border border-dashed border-amber-200/50 dark:border-amber-500/20 rounded-2xl bg-white/40 dark:bg-slate-950/20 backdrop-blur-sm shadow-inner">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No Courses Yet</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Your learning adventure starts here. Enroll in a course to begin.</p>
                <Link
                  to="/courses"
                  className="mt-6 inline-flex items-center rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-6 py-3 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(255,160,70,0.35)] transition hover:brightness-105"
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
                <StatCard icon={<TrendingUp />} label="In Progress" value={stats.coursesInProgress} color="amber" />
                <StatCard icon={<CheckCircle />} label="Completed" value={stats.coursesCompleted} color="green" />
                <StatCard icon={<Award />} label="Certificates" value={stats.certificatesEarned} color="yellow" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Quick Links</h2>
              <div className="glass-panel p-6">
                <ul className="space-y-3">
                  <li><Link to="/courses" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-300 font-medium"><ArrowRight className="w-4 h-4 mr-3 text-amber-500"/>Browse All Courses</Link></li>
                  <li><Link to="/profile" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-300 font-medium"><ArrowRight className="w-4 h-4 mr-3 text-amber-500"/>My Profile</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Recommendations Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Discover New Courses</h2>
          <div className="glass-panel p-4">
            <CourseRecommendations />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
