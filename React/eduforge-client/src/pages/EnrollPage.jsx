// src/pages/EnrollPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosConfig";

const EnrollPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .get(`/courses/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch((err) => console.error(err));
  }, [courseId]);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setSuccess(true);
      setTimeout(() => navigate(`/progress/${courseId}`), 1500); // redirect after success
    } catch (err) {
      console.error(err);
      alert("Failed to enroll. Please try again.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6 flex justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Enroll in <span className="text-indigo-600">{course.title}</span>
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          By enrolling, you’ll gain access to all lessons and resources.
        </p>

        {/* Success message */}
        {success ? (
          <p className="text-green-600 font-medium mb-6">
            ✅ Successfully enrolled! Redirecting...
          </p>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {loading ? "Enrolling..." : "Confirm Enroll"}
              </button>
              <Link
                to="/courses"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollPage;
