import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen, GraduationCap } from 'lucide-react';
import api from '../utils/axiosConfig';

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await api.get(`/certificates/verify/${certificateId}`);
        setCertificate(response.data.certificate);
      } catch (err) {
        setError(err.response?.data?.error || 'Certificate not found');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mx-auto"></div>
          <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">Verifying Certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Verification Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Certificate Verified</h1>
          <p className="text-gray-600 dark:text-gray-400">This certificate is authentic and verified by EduForge</p>
        </div>

        {/* Certificate Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
                <p className="text-purple-100">EduForge Learning Platform</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-100">Certificate ID</p>
                <p className="font-mono text-lg font-bold">{certificate.certificateId}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Info */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Student Name</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{certificate.student}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{certificate.course}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{certificate.instructor}</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Award className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Grade</p>
                    <p className="text-2xl font-bold text-purple-600">{certificate.grade}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Issued Date</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {certificate.metadata && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Course Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-semibold">{certificate.metadata.courseDuration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Completion</p>
                        <p className="font-semibold">{certificate.metadata.completionPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Modules</p>
                        <p className="font-semibold">
                          {certificate.metadata.modulesCompleted}/{certificate.metadata.totalModules}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This certificate was verified on {new Date().toLocaleDateString()}
          </p>
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Verified by EduForge Certificate Authority</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
