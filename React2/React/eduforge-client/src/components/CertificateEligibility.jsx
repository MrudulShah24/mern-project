import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, AlertCircle, ChevronRight, Check } from 'lucide-react';
import api from '../utils/axiosConfig';

const CertificateEligibility = ({ courseId }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const checkEligibility = async () => {
    try {
      setLoading(true);
      
      // First check the course progress
      const progressRes = await api.get(`/courses/${courseId}/progress`);
      setProgress(progressRes.data.percentage || 0);
      
      // Then check certificate eligibility
      const res = await api.get(`/enrollments/certificate-eligibility/${courseId}`);
      setEligibility(res.data);
      setError('');
    } catch (err) {
      setError('Failed to check certificate eligibility. Try again later.');
      console.error("Certificate eligibility error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEligibility();
  }, [courseId]);
  
  const generateCertificate = async () => {
    try {
      setGenerating(true);
      await api.post(`/certificates/generate/${courseId}`);
      await checkEligibility();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Checking Eligibility...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
          <div className="bg-purple-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    );
  }

  // If course is complete (100%) but no certificate yet, show generate button
  if (progress === 100 && (!eligibility?.success || error)) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">Course Completed!</h3>
            <p className="text-sm text-green-600 dark:text-green-500">You've completed 100% of this course</p>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You're eligible to receive a certificate for this course. Generate your certificate now to showcase your achievement.
        </p>
        
        <button
          onClick={generateCertificate}
          disabled={generating}
          className={`inline-flex items-center px-6 py-3 ${
            generating ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
          } text-white rounded-lg transition-colors`}
        >
          {generating ? (
            <>Generating Certificate...</>
          ) : (
            <>Generate Certificate <Award className="ml-2 w-5 h-5" /></>
          )}
        </button>
      </div>
    );
  }

  // If eligible, show certificate link
  if (eligibility?.success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
            <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">Certificate Available!</h3>
            <p className="text-sm text-green-600 dark:text-green-500">Your certificate is ready</p>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Congratulations! You have completed this course and earned a certificate. Click below to view, download, or share your certificate.
        </p>

        <Link 
          to={`/certificate/${courseId}`} 
          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          View Certificate <ChevronRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    );
  }

  // Not eligible - show progress
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Certificate Not Available Yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Keep going, you're making progress!</p>
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Complete 100% of the course to earn your certificate. Mark all modules as completed to track your progress.
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Your progress:</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          You need to complete {100 - progress}% more of the course
        </p>
      </div>
    </div>
  );
};

export default CertificateEligibility;