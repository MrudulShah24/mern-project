import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Users, Award, Target } from 'lucide-react';
import api from '../utils/axiosConfig';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

const CourseAnalytics = ({ courseId }) => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState({
    totalEnrollments: 0,
    completionRate: 0,
    averageRating: 0,
    averageCompletionDays: 0,
    quizStats: [],
    studentEngagement: [],
    demographics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsRes, progressRes, quizRes] = await Promise.all([
          api.get(`/courses/${courseId}/analytics?timeframe=${timeframe}`),
          api.get(`/courses/${courseId}/progress-stats`),
          api.get(`/courses/${courseId}/quiz-stats`)
        ]);

        setAnalytics({
          ...analyticsRes.data,
          progressStats: progressRes.data,
          quizStats: quizRes.data
        });
      } catch (err) {
        console.error('Analytics error:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId, timeframe]);

  const chartStyles = {
    axis: {
      tick: { fill: theme === 'dark' ? '#9CA3AF' : '#374151' },
    },
    tooltip: {
      contentStyle: {
        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        color: theme === 'dark' ? '#F3F4F6' : '#111827',
      },
    },
    legend: {
      wrapperStyle: {
        color: theme === 'dark' ? '#F3F4F6' : '#111827',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Course Analytics</h2>
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 rounded-lg transition ${
                  timeframe === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 p-6 rounded-xl">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
              <h3 className="text-gray-600 dark:text-gray-400">Enrollments</h3>
            </div>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {analytics.totalEnrollments}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 p-6 rounded-xl">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="text-gray-600 dark:text-gray-400">Completion</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {analytics.completionRate}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/50 dark:to-rose-900/50 p-6 rounded-xl">
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-pink-600 dark:text-pink-400 mr-2" />
              <h3 className="text-gray-600 dark:text-gray-400">Rating</h3>
            </div>
            <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              {analytics.averageRating.toFixed(1)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/50 dark:to-orange-900/50 p-6 rounded-xl">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400 mr-2" />
              <h3 className="text-gray-600 dark:text-gray-400">Avg. Time</h3>
            </div>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {analytics.averageCompletionDays}d
            </p>
          </div>
        </div>

        {/* Progress and Quiz Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Student Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.progressStats || []}>
                  <XAxis dataKey="module" {...chartStyles.axis} />
                  <YAxis {...chartStyles.axis} />
                  <Tooltip {...chartStyles.tooltip} />
                  <Bar dataKey="completionRate" fill="#8b5cf6" name="Completion Rate %" />
                  <Legend {...chartStyles.legend} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quiz Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.quizStats || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={{ fill: theme === 'dark' ? '#F3F4F6' : '#111827' }}
                  >
                    {(analytics.quizStats || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartStyles.tooltip} />
                  <Legend {...chartStyles.legend} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Student Engagement Timeline */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Student Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.studentEngagement || []}>
                <XAxis dataKey="date" {...chartStyles.axis} />
                <YAxis {...chartStyles.axis} />
                <Tooltip {...chartStyles.tooltip} />
                <Bar dataKey="activeStudents" fill="#6366f1" name="Active Students" />
                <Legend {...chartStyles.legend} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Student Demographics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.demographics || []}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={{ fill: theme === 'dark' ? '#F3F4F6' : '#111827' }}
                >
                  {(analytics.demographics || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartStyles.tooltip} />
                <Legend {...chartStyles.legend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAnalytics;
