// src/pages/EnrollPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { Star, Clock, Award, BookOpen } from 'lucide-react';

const EnrollPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if already enrolled
        const enrollmentRes = await api.get(`/enrollments/status/${courseId}`);
        if (enrollmentRes.data.enrolled) {
          setAlreadyEnrolled(true);
          setTimeout(() => navigate(`/course-dashboard/${courseId}`), 1500);
        }
        
        // Get course details
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourse(courseRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchData();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      // Use enrollments endpoint so Dashboard sees the enrollment
      const response = await api.post(`/enrollments`, { courseId });
      console.log("Enrollment successful:", response.data);
      setSuccess(true);
      
      // Check if redirectTo is provided, otherwise use default
      const redirectPath = response.data.redirectTo || `/course-dashboard/${courseId}`;
      setTimeout(() => navigate(redirectPath), 1500);
    } catch (err) {
      console.error("Enrollment error:", err.response?.data || err.message);
      alert(`Failed to enroll: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading course info...
      </div>
    );
  }
  
  if (alreadyEnrolled) {
    return (
      <div className="min-h-screen bg-transparent py-10 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel p-8 shadow-xl bg-white/50 dark:bg-slate-900/60">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Already Enrolled!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You are already enrolled in this course. Redirecting to course dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/60">
          <div className="grid md:grid-cols-2">
            {/* Left: Course Preview */}
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-semibold">
                  {course.category || 'General'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                {course.description}
              </p>
              <img
                className="w-full h-56 object-cover rounded-xl border border-amber-100/40 dark:border-slate-800 shadow-inner"
                src={course.thumbnail || '/images/placeholders/default-thumbnail.svg'}
                alt={course.title}
              />
              <div className="grid grid-cols-3 gap-4 mt-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center"><Star className="w-4 h-4 text-yellow-500 mr-2" /> {course.rating || '4.5'}</div>
                <div className="flex items-center"><Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 mr-2" /> {course.duration || '6h'}</div>
                <div className="flex items-center"><Award className="w-4 h-4 text-amber-500 dark:text-amber-400 mr-2" /> Certificate</div>
              </div>
            </div>

            {/* Right: Enroll Card */}
            <div className="bg-amber-500/5 dark:bg-slate-950/30 p-8 md:border-l border-amber-100/60 dark:border-amber-500/15">
              <div className="glass-panel p-6 shadow-md bg-white/40 dark:bg-slate-950/20 rounded-2xl">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enroll in this course</h2>
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">${course.price || '49.99'}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">30-Day Money-Back Guarantee</p>

                {success ? (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl font-semibold">
                    ✅ Successfully enrolled! Redirecting...
                  </div>
                ) : (
                  <>
                    <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-center"><Clock className="w-4 h-4 text-amber-500/70 mr-2" /> {course.duration || '6 hours'} on-demand video</li>
                      <li className="flex items-center"><BookOpen className="w-4 h-4 text-amber-500/70 mr-2" /> Articles & resources</li>
                      <li className="flex items-center"><Award className="w-4 h-4 text-amber-500/70 mr-2" /> Certificate of completion</li>
                    </ul>

                    <div className="mt-8 flex flex-col space-y-3">
                      <button
                        onClick={handleEnroll}
                        disabled={loading}
                        className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-sm shadow-amber-500/10 hover:brightness-105 transition disabled:opacity-60"
                      >
                        {loading ? "Enrolling..." : "Confirm Enroll"}
                      </button>
                      <Link
                        to={`/courses/${courseId}`}
                        className="w-full text-center px-6 py-3 border border-amber-150 dark:border-amber-500/25 text-gray-750 hover:text-amber-600 dark:text-gray-300 bg-white/40 dark:bg-slate-850/40 rounded-xl hover:bg-amber-500/5 transition font-semibold"
                      >
                        Cancel & Go Back
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollPage;
