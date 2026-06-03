import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/axiosConfig";

const ProgressPage = () => {
  const { courseId } = useParams();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This API call is correct, we just need to handle the response properly
    api.get(`/courses/${courseId}/progress`)
      .then((res) => {
        setProgressData(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch progress:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-gray-600 font-medium">Loading Progress...</div>;
  }

  if (!progressData) {
    return <div className="min-h-screen flex justify-center items-center text-red-500 font-medium">Could not load progress data. You may not be enrolled in this course.</div>;
  }

  return (
    <div className="min-h-screen bg-transparent p-6 flex justify-center items-center">
      <div className="w-full max-w-4xl mx-auto glass-panel p-8 rounded-3xl shadow-xl border-amber-100/60 dark:border-amber-500/15">
        {/* ✅ Use the correct field for the course title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{progressData.course}</h1>
        
        <div className="mb-8">
          <div className="flex justify-between mb-2.5 font-medium">
            <span className="text-gray-700 dark:text-gray-300">Overall Progress</span>
            {/* ✅ Use the 'percentage' field from the backend response */}
            <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">{progressData.percentage}%</span>
          </div>
          <div className="w-full bg-amber-100/40 dark:bg-slate-800 rounded-full h-4 overflow-hidden shadow-inner border border-amber-100/20 dark:border-slate-700/50">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressData.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            You have completed {progressData.completedModules} of {progressData.totalModules} modules.
          </p>
        </div>

        {/* You can map over progressData.progressDetails here to show module status */}

        <div className="mt-8 flex justify-end">
          <Link 
            to="/dashboard" 
            className="px-6 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;