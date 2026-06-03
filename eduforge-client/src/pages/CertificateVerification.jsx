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
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-amber-500 mx-auto"></div>
          <p className="text-lg mt-4 text-gray-700 dark:text-gray-300 font-medium">Verifying Certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="max-w-md mx-auto text-center p-8 glass-panel shadow-xl bg-white/50 dark:bg-slate-900/60">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:brightness-105 transition shadow-sm"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Verification Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Certificate Verified</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">This certificate is authentic and verified by EduForge</p>
        </div>

        {/* Certificate Details */}
        <div className="glass-panel shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/60">
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
                <p className="text-amber-100 font-medium">EduForge Learning Platform</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-150">Certificate ID</p>
                <p className="font-mono text-lg font-bold">{certificate.certificateId}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Info */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><User className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Student Name</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{certificate.student}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Course</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{certificate.course}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><GraduationCap className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Instructor</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{certificate.instructor}</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Grade</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{certificate.grade}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Issued Date</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {certificate.metadata && (
                  <div className="bg-amber-500/5 dark:bg-slate-950/40 border border-amber-100/40 dark:border-amber-500/10 rounded-2xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-950 dark:text-white mb-3 text-sm uppercase tracking-wider">Course Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Duration</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{certificate.metadata.courseDuration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Completion</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{certificate.metadata.completionPercentage}%</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Modules</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                          {certificate.metadata.modulesCompleted} of {certificate.metadata.totalModules} completed
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
          <p className="text-gray-650 dark:text-gray-400 mb-4 font-medium">
            This certificate was verified on {new Date().toLocaleDateString()}
          </p>
          <div className="inline-flex items-center space-x-2 text-sm text-gray-550 dark:text-gray-400 font-semibold bg-white/40 dark:bg-slate-900/45 px-4 py-2 border border-amber-100/30 dark:border-amber-500/10 rounded-full shadow-sm">
            <CheckCircle className="w-4.5 h-4.5 text-green-500" />
            <span>Verified by EduForge Certificate Authority</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
