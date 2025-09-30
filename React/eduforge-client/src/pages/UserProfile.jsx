import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Book, Award, Star, Settings, Edit3, Camera, X } from 'lucide-react';
import api from '../utils/axiosConfig';
import Achievements from '../components/Achievements';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // courseId -> percentage
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', bio: '', avatar: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const getLoggedInUserId = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      return stored?.id || stored?._id;
    } catch {
      return null;
    }
  };

  const fetchUserData = async () => {
    try {
      const userId = getLoggedInUserId();
      if (!userId) throw new Error('Not logged in');

      const [profileRes, enrollmentsRes, coursesRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/enrollments/my-enrollments`),
        api.get('/courses')
      ]);

      setProfile(profileRes.data);
      setFormData({
        name: profileRes.data.name,
        email: profileRes.data.email,
        bio: profileRes.data.bio || '',
        avatar: profileRes.data.avatar || ''
      });
      const validEnrollments = enrollmentsRes.data.filter(e => e.course);
      setEnrollments(validEnrollments);
      setAllCourses(coursesRes.data);

      // fetch progress for each enrolled course
      const progressPromises = validEnrollments.map(async (e) => {
        try {
          const res = await api.get(`/courses/${e.course._id}/progress`);
          return { courseId: e.course._id, percentage: res.data?.percentage || 0 };
        } catch {
          return { courseId: e.course._id, percentage: 0 };
        }
      });
      const results = await Promise.all(progressPromises);
      const map = {};
      results.forEach(r => { map[r.courseId] = r.percentage; });
      setProgressMap(map);

      setLoading(false);
    } catch (err) {
      setError('Failed to load user data. Please try again later.');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const userId = profile._id || profile.id;
      const updated = await api.put(`/users/${userId}`, formData);
      setEditing(false);
      setProfile(updated.data);
      // update localStorage user if name/email changed (for Navbar etc.)
      try {
        const stored = JSON.parse(localStorage.getItem('user')) || {};
        const merged = { ...stored, name: updated.data.name, email: updated.data.email, avatar: updated.data.avatar };
        localStorage.setItem('user', JSON.stringify(merged));
      } catch {}
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const completedCourses = enrollments.filter(e => (progressMap[e.course._id] || 0) === 100);
  const [certificates, setCertificates] = useState([]);

  // Fetch user certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/certificates/my-certificates');
        setCertificates(res.data);
      } catch (err) {
        console.error('Failed to fetch certificates:', err);
      }
    };
    if (enrollments.length > 0) {
      fetchCertificates();
    }
  }, [enrollments]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Loading Profile...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Profile Information</h3>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {editing ? <X className="w-5 h-5 mr-2" /> : <Settings className="w-5 h-5 mr-2" />}
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                  <input type="text" value={formData.avatar} onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows="4" className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-gray-100"></textarea>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition">Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-lg">
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-gray-800">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Name</h4>
                  <p className="text-gray-900 dark:text-gray-100">{profile.name}</p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-gray-800">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email</h4>
                  <p className="text-gray-900 dark:text-gray-100">{profile.email}</p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-gray-800">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Bio</h4>
                  <p className="text-gray-800 dark:text-gray-200 italic">{profile.bio || 'No bio added yet.'}</p>
                </div>
              </div>
            )}
          </div>
        );
      case 'enrollments':
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Courses</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.course._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex items-center p-4 transition-shadow hover:shadow-lg">
                  <img src={enrollment.course.thumbnail || '/images/placeholders/default-thumbnail.svg'} alt={enrollment.course.title} className="w-24 h-24 object-cover rounded-lg" />
                  <div className="flex-grow ml-4">
                    <h4 className="font-bold text-gray-800 dark:text-white">{enrollment.course.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">by {enrollment.course.instructor?.name || 'N/A'}</p>
                    <button onClick={() => navigate(`/course-dashboard/${enrollment.course._id}`)} className="text-sm font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">Continue Learning →</button>
                  </div>
                  <div className="w-16 h-16 ml-4 flex-shrink-0">
                    <CircularProgressbar value={progressMap[enrollment.course._id] || 0} text={`${Math.round(progressMap[enrollment.course._id] || 0)}%`} styles={buildStyles({ textColor: '#4f46e5', pathColor: '#6366f1', trailColor: '#e5e7eb' })} className="dark-progress" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'achievements':
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Achievements</h3>
            <Achievements completedCourses={completedCourses} allCourses={allCourses} />
          </div>
        );
      case 'certificates':
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Certificates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.length > 0 ? certificates.map((cert) => (
                <div key={cert._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h4 className="font-bold text-gray-800 dark:text-white">{cert.course.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Grade: <span className="font-semibold text-purple-600">{cert.grade}</span></p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  <div className="space-y-2">
                    <button onClick={() => navigate(`/certificate/${cert.course._id}`)} className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">View Certificate</button>
                    <a href={`/verify/${cert.certificateId}`} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2 border border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition">Verify Online</a>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No certificates earned yet.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Complete a course to earn your first certificate!</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="relative h-48 md:h-64 rounded-b-lg bg-gradient-to-r from-purple-500 to-indigo-600">
            {/* Placeholder for a banner image */}
          </div>
          <div className="flex flex-col md:flex-row items-center -mt-16 md:-mt-24 px-6">
            <div className="relative">
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                alt={profile.name}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
              />
              <button className="absolute bottom-2 right-2 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
              </button>
            </div>
            <div className="mt-4 md:mt-12 md:ml-6 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">{profile.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            </div>
          </div>
          {/* Tabs */}
          <nav className="mt-6 flex border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'profile' ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Profile</button>
            <button onClick={() => setActiveTab('enrollments')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'enrollments' ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>My Courses</button>
            <button onClick={() => setActiveTab('achievements')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'achievements' ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Achievements</button>
            <button onClick={() => setActiveTab('certificates')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'certificates' ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Certificates</button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default UserProfile;