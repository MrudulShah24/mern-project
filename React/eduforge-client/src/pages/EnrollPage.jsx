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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-10 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Already Enrolled!</h2>
            <p className="text-gray-600 mb-6">You are already enrolled in this course. Redirecting to course dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left: Course Preview */}
            <div className="p-8">
              <div className="mb-6">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                  {course.category || 'General'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                {course.title}
              </h1>
              <p className="text-gray-600 mb-6">
                {course.description}
              </p>
              <img
                className="w-full h-56 object-cover rounded-lg"
                src={course.thumbnail || '/images/placeholders/default-thumbnail.svg'}
                alt={course.title}
              />
              <div className="grid grid-cols-3 gap-4 mt-6 text-sm text-gray-600">
                <div className="flex items-center"><Star className="w-4 h-4 text-yellow-500 mr-2" /> {course.rating || '4.5'}</div>
                <div className="flex items-center"><Clock className="w-4 h-4 text-green-600 mr-2" /> {course.duration || '6h'}</div>
                <div className="flex items-center"><Award className="w-4 h-4 text-purple-600 mr-2" /> Certificate</div>
              </div>
            </div>

            {/* Right: Enroll Card */}
            <div className="bg-gray-50 p-8 md:border-l md:border-gray-200">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Enroll in this course</h2>
                  <span className="text-2xl font-extrabold text-emerald-600">${course.price || '49.99'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">30-Day Money-Back Guarantee</p>

                {success ? (
                  <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
                    ✅ Successfully enrolled! Redirecting...
                  </div>
                ) : (
                  <>
                    <ul className="mt-6 space-y-3 text-sm text-gray-700">
                      <li className="flex items-center"><Clock className="w-4 h-4 text-gray-500 mr-2" /> {course.duration || '6 hours'} on-demand video</li>
                      <li className="flex items-center"><BookOpen className="w-4 h-4 text-gray-500 mr-2" /> Articles & resources</li>
                      <li className="flex items-center"><Award className="w-4 h-4 text-gray-500 mr-2" /> Certificate of completion</li>
                    </ul>

                    <div className="mt-8 flex flex-col space-y-3">
                      <button
                        onClick={handleEnroll}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {loading ? "Enrolling..." : "Confirm Enroll"}
                      </button>
                      <Link
                        to={`/courses/${courseId}`}
                        className="w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
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
