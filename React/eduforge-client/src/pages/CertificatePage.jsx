import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import Certificate from '../components/Certificate';

const CertificatePage = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await api.get(`/certificates/course/${courseId}`);
        // API returns: { certificateId, student, course, instructor, issuedAt, grade }
        const mapped = {
          certificateId: res.data.certificateId,
          student: { name: res.data.student },
          course: { title: res.data.course },
          instructor: { name: res.data.instructor },
          issueDate: res.data.issuedAt,
          grade: res.data.grade
        };
        setData(mapped);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading certificate...
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Link to="/dashboard" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Back to Dashboard</Link>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8">
      <Certificate certificate={data} />
    </div>
  );
};

export default CertificatePage;
