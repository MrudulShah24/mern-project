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

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200">Loading Profile...</div>;
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
                className="flex items-center text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold py-2 px-4 rounded-xl transition"
              >
                {editing ? <X className="w-5 h-5 mr-2" /> : <Settings className="w-5 h-5 mr-2" />}
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Avatar URL</label>
                  <input 
                    type="text" 
                    value={formData.avatar} 
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} 
                    className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                  <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                    rows="4" 
                    className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500"
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:brightness-105 transition shadow-sm">Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-lg">
                <div className="p-5 border-l-4 border-amber-500 bg-white/40 dark:bg-slate-900/40 rounded-r-2xl border border-amber-100/40 dark:border-amber-500/10 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</h4>
                  <p className="text-gray-950 dark:text-gray-100 font-bold mt-1">{profile.name}</p>
                </div>
                <div className="p-5 border-l-4 border-amber-500 bg-white/40 dark:bg-slate-900/40 rounded-r-2xl border border-amber-100/40 dark:border-amber-500/10 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</h4>
                  <p className="text-gray-950 dark:text-gray-100 font-medium mt-1">{profile.email}</p>
                </div>
                <div className="p-5 border-l-4 border-amber-500 bg-white/40 dark:bg-slate-900/40 rounded-r-2xl border border-amber-100/40 dark:border-amber-500/10 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio</h4>
                  <p className="text-gray-800 dark:text-gray-200 italic mt-1">{profile.bio || 'No bio added yet.'}</p>
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
                <div key={enrollment.course._id} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md p-5 shadow-md flex items-center hover:border-amber-400 dark:hover:border-amber-500/40 border border-amber-100/60 dark:border-amber-500/15 rounded-2xl transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(245,158,11,0.04),_transparent_40%)] pointer-events-none" />
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-500">
                    <Book className="w-10 h-10 text-amber-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-grow ml-5 relative z-10">
                    <h4 className="font-bold text-gray-800 dark:text-white">{enrollment.course.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">by {enrollment.course.instructor?.name || 'N/A'}</p>
                    <button onClick={() => navigate(`/course-dashboard/${enrollment.course._id}`)} className="text-sm font-semibold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition">Continue Learning →</button>
                  </div>
                  <div className="w-16 h-16 ml-4 flex-shrink-0">
                    <CircularProgressbar value={progressMap[enrollment.course._id] || 0} text={`${Math.round(progressMap[enrollment.course._id] || 0)}%`} styles={buildStyles({ textColor: '#f59e0b', pathColor: '#f59e0b', trailColor: 'rgba(0,0,0,0.1)' })} className="dark-progress" />
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
                <div key={cert._id} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md p-6 shadow-md border border-amber-100/60 dark:border-amber-500/15 rounded-2xl text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.03),_transparent_55%)] pointer-events-none" />
                  <Award className="w-12 h-12 text-amber-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{cert.course.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Grade: <span className="font-bold text-amber-600 dark:text-amber-400">{cert.grade}</span></p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  <div className="space-y-3 relative z-10">
                    <button onClick={() => navigate(`/certificate/${cert.course._id}`)} className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:brightness-105 shadow-sm transition">View Certificate</button>
                    <a href={`/verify/${cert.certificateId}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-2 border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-white/40 dark:bg-slate-800/40 hover:bg-amber-500/5 font-semibold rounded-xl transition">Verify Online</a>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4 font-semibold">No certificates earned yet.</p>
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
    <div className="min-h-screen bg-transparent">
      {/* Profile Header */}
      <div className="glass-panel overflow-hidden shadow-lg mb-8 bg-white/50 dark:bg-slate-900/60">
        <div className="container mx-auto">
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
            <div className="absolute inset-0 bg-grid opacity-25" />
          </div>
          <div className="flex flex-col md:flex-row items-center -mt-16 md:-mt-24 px-8 pb-6">
            <div className="relative">
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                alt={profile.name}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white dark:border-slate-900 shadow-lg object-cover bg-white"
              />
              <button className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
              </button>
            </div>
            <div className="mt-4 md:mt-12 md:ml-6 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{profile.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{profile.email}</p>
            </div>
          </div>
          {/* Tabs */}
          <nav className="px-8 flex border-b border-amber-100/40 dark:border-amber-500/15 overflow-x-auto whitespace-nowrap">
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'profile' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Profile</button>
            <button onClick={() => setActiveTab('enrollments')} className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'enrollments' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>My Courses</button>
            <button onClick={() => setActiveTab('achievements')} className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'achievements' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Achievements</button>
            <button onClick={() => setActiveTab('certificates')} className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'certificates' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Certificates</button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto py-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default UserProfile;
