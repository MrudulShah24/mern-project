import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { Users, Book, BarChart2, Trash2, Search, X, Edit, Shield, CheckCircle, PlusCircle, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState({ users: true, courses: true });
  const [searchTerm, setSearchTerm] = useState({ users: "", courses: "" });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, type: null, id: null });
  const [showEditModal, setShowEditModal] = useState({ show: false, type: null, data: null });
  const [generatingCourses, setGeneratingCourses] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchUsers = () => {
    setLoading(prev => ({ ...prev, users: true }));
    api.get("/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(prev => ({ ...prev, users: false })));
  };

  const fetchCourses = () => {
    setLoading(prev => ({ ...prev, courses: true }));
    api.get("/courses")
      .then((res) => setCourses(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(prev => ({ ...prev, courses: false })));
  };

  const handleDelete = async () => {
    const { type, id } = showDeleteModal;
    if (!type || !id) return;

    try {
      await api.delete(`/${type}/${id}`);
      if (type === 'users') {
        setUsers(prev => prev.filter((u) => u._id !== id));
      } else if (type === 'courses') {
        setCourses(prev => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
    } finally {
      setShowDeleteModal({ show: false, type: null, id: null });
    }
  };

  const handleEditSubmit = async () => {
    const { type, data } = showEditModal;
    if (!type || !data) return;

    try {
      if (type === 'users') {
        await api.put(`/users/${data._id}`, {
          name: data.name,
          email: data.email,
          role: data.role
        });
        setUsers(prev => prev.map(user => user._id === data._id ? data : user));
      } else if (type === 'courses') {
        await api.put(`/courses/${data._id}`, {
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          level: data.level
        });
        setCourses(prev => prev.map(course => course._id === data._id ? data : course));
      }
      setShowEditModal({ show: false, type: null, data: null });
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
    }
  };

  const openDeleteModal = (type, id) => {
    setShowDeleteModal({ show: true, type, id });
  };

  const openEditModal = (type, item) => {
    setShowEditModal({ show: true, type, data: { ...item } });
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.users.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.users.toLowerCase())
    ), [users, searchTerm.users]);

  const filteredCourses = useMemo(() =>
    courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.courses.toLowerCase())
    ), [courses, searchTerm.courses]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView users={users} courses={courses} />;
      case "users":
        return <ManageUsersView users={filteredUsers} loading={loading.users} searchTerm={searchTerm.users} setSearchTerm={setSearchTerm} openDeleteModal={openDeleteModal} openEditModal={openEditModal} />;
      case "courses":
        return <ManageCoursesView courses={filteredCourses} loading={loading.courses} searchTerm={searchTerm.courses} setSearchTerm={setSearchTerm} openDeleteModal={openDeleteModal} openEditModal={openEditModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/45 dark:bg-slate-950/60 shadow-none flex-shrink-0 border-r border-amber-100/30 dark:border-amber-500/15 backdrop-blur-xl">
        <div className="p-6 text-2xl font-bold font-display bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent border-b border-amber-100/35 dark:border-amber-500/15">
          EduForge Admin
        </div>
        <nav className="p-4 space-y-1">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 transition ${activeTab === 'dashboard' ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 font-semibold border-l-4 border-amber-500 pl-3' : 'hover:bg-amber-50/50 dark:hover:bg-slate-800/40'}`}>
            <BarChart2 className="w-5 h-5 mr-3 text-amber-500" /> Dashboard
          </button>
          <button onClick={() => setActiveTab("users")} className={`w-full flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 transition ${activeTab === 'users' ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 font-semibold border-l-4 border-amber-500 pl-3' : 'hover:bg-amber-50/50 dark:hover:bg-slate-800/40'}`}>
            <Users className="w-5 h-5 mr-3 text-amber-500" /> Manage Users
          </button>
          <button onClick={() => setActiveTab("courses")} className={`w-full flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 transition ${activeTab === 'courses' ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 font-semibold border-l-4 border-amber-500 pl-3' : 'hover:bg-amber-50/50 dark:hover:bg-slate-800/40'}`}>
            <Book className="w-5 h-5 mr-3 text-amber-500" /> Manage Courses
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 md:p-10">
        {renderContent()}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex justify-center items-center z-50 backdrop-blur-md">
          <div className="glass-panel p-8 shadow-2xl backdrop-blur-2xl w-full max-w-md bg-white/70 dark:bg-slate-900/70">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end mt-8 space-x-4">
              <button 
                onClick={() => setShowDeleteModal({ show: false, type: null, id: null })} 
                className="px-6 py-2 bg-white/60 dark:bg-slate-800/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal.show && showEditModal.type === 'users' && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex justify-center items-center z-50 backdrop-blur-md">
          <div className="glass-panel p-8 shadow-2xl backdrop-blur-2xl w-full max-w-md bg-white/70 dark:bg-slate-900/70">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Edit User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={showEditModal.data?.name || ''} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, name: e.target.value } 
                  }))} 
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  value={showEditModal.data?.email || ''} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, email: e.target.value } 
                  }))} 
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select 
                  value={showEditModal.data?.role || 'student'} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, role: e.target.value } 
                  }))}
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/45 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                >
                  <option value="student" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Student</option>
                  <option value="admin" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-8 space-x-4">
              <button 
                onClick={() => setShowEditModal({ show: false, type: null, data: null })} 
                className="px-6 py-2 bg-white/60 dark:bg-slate-800/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSubmit} 
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:brightness-105 shadow-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal.show && showEditModal.type === 'courses' && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex justify-center items-center z-50 backdrop-blur-md">
          <div className="glass-panel p-8 shadow-2xl backdrop-blur-2xl w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/70 dark:bg-slate-900/70">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Edit Course</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input 
                  type="text" 
                  value={showEditModal.data?.title || ''} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, title: e.target.value } 
                  }))} 
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input 
                  type="text" 
                  value={showEditModal.data?.category || ''} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, category: e.target.value } 
                  }))} 
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  value={showEditModal.data?.description || ''} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, description: e.target.value } 
                  }))} 
                  rows="4"
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                <select 
                  value={showEditModal.data?.level || 'Beginner'} 
                  onChange={(e) => setShowEditModal(prev => ({ 
                    ...prev, 
                    data: { ...prev.data, level: e.target.value } 
                  }))}
                  className="w-full px-4 py-2.5 border border-amber-100/60 dark:border-amber-500/15 rounded-xl bg-white/60 dark:bg-slate-950/45 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition"
                >
                  <option value="Beginner" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Beginner</option>
                  <option value="Intermediate" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Intermediate</option>
                  <option value="Advanced" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-8 space-x-4">
              <button 
                onClick={() => setShowEditModal({ show: false, type: null, data: null })} 
                className="px-6 py-2 bg-white/60 dark:bg-slate-800/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSubmit} 
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:brightness-105 shadow-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ users, courses }) => {
    const [enrollmentStats, setEnrollmentStats] = useState({ total: 0, active: 0, completed: 0 });
    const [certificateStats, setCertificateStats] = useState({ total: 0, verified: 0 });
    const [loading, setLoading] = useState(true);
    const [generatingCourses, setGeneratingCourses] = useState(false);
    const [generationMessage, setGenerationMessage] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [enrollRes, certRes] = await Promise.all([
                    api.get('/analytics/enrollments'),
                    api.get('/certificates/analytics')
                ]);
                
                setEnrollmentStats(enrollRes.data || { total: 0, active: 0, completed: 0 });
                setCertificateStats(certRes.data || { total: 0, verified: 0 });
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                // Set default values if API fails
                setEnrollmentStats({ total: 0, active: 0, completed: 0 });
                setCertificateStats({ total: 0, verified: 0 });
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();
    }, []);

    const courseData = useMemo(() => {
        const categoryCount = courses.reduce((acc, course) => {
            const category = course.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(categoryCount).map(key => ({ name: key, courses: categoryCount[key] }));
    }, [courses]);

    const generateDummyCourses = async () => {
        try {
            setGeneratingCourses(true);
            setGenerationMessage('Generating professional-quality dummy courses...');
            
            const response = await api.post('/admin/generate-courses');
            
            setGenerationMessage('Success! Dummy courses have been generated. Refreshing data...');
            
            // Refresh the page after 2 seconds to show the new courses
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Failed to generate dummy courses:', error);
            setGenerationMessage('Error: Failed to generate dummy courses. Please try again.');
        } finally {
            setTimeout(() => {
                setGeneratingCourses(false);
                setGenerationMessage('');
            }, 5000);
        }
    };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">Dashboard</h1>
      
      {/* Admin Actions */}
      <div className="glass-panel p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Admin Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={generateDummyCourses}
            disabled={generatingCourses}
            className={`px-4 py-2 flex items-center rounded-lg ${
              generatingCourses 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105'
            } text-slate-900 font-semibold`}
          >
            <Database className="w-4 h-4 mr-2" />
            {generatingCourses ? 'Generating...' : 'Generate Professional Courses'}
          </button>
        </div>
        {generationMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            generationMessage.includes('Error') 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {generationMessage}
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center shadow-md">
          <div className="bg-blue-500/10 dark:bg-blue-900/40 p-3 rounded-2xl mr-4 shadow-sm border border-blue-500/10">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{users.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center shadow-md">
          <div className="bg-emerald-500/10 dark:bg-emerald-900/40 p-3 rounded-2xl mr-4 shadow-sm border border-emerald-500/10">
            <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Courses</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{courses.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center shadow-md">
          <div className="bg-amber-500/10 dark:bg-amber-500/20 p-3 rounded-2xl mr-4 shadow-sm border border-amber-500/10">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Admins</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
      </div>

      {/* Enrollment Stats */}
      <div className="glass-panel p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Enrollment Statistics</h2>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 dark:border-amber-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/15 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">Total Enrollments</p>
              <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{enrollmentStats.total}</p>
            </div>
            <div className="p-4 bg-blue-500/5 dark:bg-blue-900/20 border border-blue-500/10 dark:border-blue-500/15 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Active Courses</p>
              <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{enrollmentStats.active}</p>
            </div>
            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-900/20 border border-emerald-500/10 dark:border-emerald-500/15 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Completed Courses</p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{enrollmentStats.completed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Stats */}
      <div className="glass-panel p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Certificate Statistics</h2>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 dark:border-amber-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/15 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">Total Certificates</p>
              <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{certificateStats.total}</p>
            </div>
            <div className="p-4 bg-teal-500/5 dark:bg-teal-900/20 border border-teal-500/10 dark:border-teal-500/15 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold">Verified Certificates</p>
              <p className="text-3xl font-extrabold text-teal-700 dark:text-teal-300 mt-1">{certificateStats.verified}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="glass-panel p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Courses by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
            <YAxis tick={{ fill: '#A0AEC0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} itemStyle={{ color: '#E2E8F0' }} />
            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
            <Bar dataKey="courses" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ManageUsersView = ({ users, loading, searchTerm, setSearchTerm, openDeleteModal, openEditModal }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Manage Users</h1>
        <div className="glass-panel p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4.5 h-4.5" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(prev => ({ ...prev, users: e.target.value }))} 
                      className="pl-11 pr-4 py-2.5 border border-amber-100/30 dark:border-amber-500/10 rounded-2xl w-80 bg-white/40 dark:bg-slate-950/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner backdrop-blur-sm"
                    />
                </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-amber-100/20 dark:border-amber-500/10 bg-white/20 dark:bg-slate-950/10 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-amber-500/5 dark:bg-slate-950/45 border-b border-amber-100/50 dark:border-amber-500/15">
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Name</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Email</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Role</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center p-8 text-gray-500 dark:text-gray-400 font-medium">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" className="text-center p-8 text-gray-500 dark:text-gray-400 font-medium">No users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="hover:bg-white/40 dark:hover:bg-white/5 border-b border-amber-50/40 dark:border-slate-800/40 transition-colors">
                                    <td className="p-4 text-gray-800 dark:text-gray-300 font-medium">{user.name}</td>
                                    <td className="p-4 text-gray-800 dark:text-gray-300">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'admin' 
                                              ? 'bg-amber-150 text-amber-850 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200/30' 
                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300 border border-gray-200/10'
                                        }`}>
                                            {user.role || "student"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-1">
                                            <button 
                                              onClick={() => openEditModal('users', user)} 
                                              className="p-2 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 rounded-xl transition"
                                            >
                                              <Edit size={18} />
                                            </button>
                                            <button 
                                              onClick={() => openDeleteModal('users', user._id)} 
                                              className="p-2 text-gray-500 hover:text-red-650 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-xl transition"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ManageCoursesView = ({ courses, loading, searchTerm, setSearchTerm, openDeleteModal, openEditModal }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Manage Courses</h1>
        <div className="glass-panel p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4.5 h-4.5" />
                    <input 
                      type="text" 
                      placeholder="Search courses..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(prev => ({ ...prev, courses: e.target.value }))} 
                      className="pl-11 pr-4 py-2.5 border border-amber-100/30 dark:border-amber-500/10 rounded-2xl w-80 bg-white/40 dark:bg-slate-950/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner backdrop-blur-sm"
                    />
                </div>
                <Link 
                  to="/create-course" 
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-650 text-white font-semibold rounded-xl hover:brightness-105 flex items-center shadow-md shadow-amber-500/10 transition"
                >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add New Course
                </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-amber-100/20 dark:border-amber-500/10 bg-white/20 dark:bg-slate-950/10 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-amber-500/5 dark:bg-slate-950/45 border-b border-amber-100/50 dark:border-amber-500/15">
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Title</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Category</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Modules</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Enrolled Students</th>
                            <th className="p-4 font-bold text-gray-950 dark:text-gray-200 text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500 dark:text-gray-400 font-medium">Loading courses...</td></tr>
                        ) : courses.length === 0 ? (
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500 dark:text-gray-400 font-medium">No courses found.</td></tr>
                        ) : (
                            courses.map((course) => (
                                <tr key={course._id} className="hover:bg-white/40 dark:hover:bg-white/5 border-b border-amber-50/40 dark:border-slate-800/40 transition-colors">
                                    <td className="p-4 text-gray-800 dark:text-gray-300 font-medium">{course.title}</td>
                                    <td className="p-4 text-gray-800 dark:text-gray-300">{course.category || "N/A"}</td>
                                    <td className="p-4 text-gray-800 dark:text-gray-300 font-semibold">{course.modules?.length || 0}</td>
                                    <td className="p-4 text-gray-800 dark:text-gray-300 font-semibold">{course.enrolledCount || 0}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-1">
                                            <button 
                                              onClick={() => openEditModal('courses', course)} 
                                              className="p-2 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 rounded-xl transition"
                                            >
                                              <Edit size={18} />
                                            </button>
                                            <button 
                                              onClick={() => openDeleteModal('courses', course._id)} 
                                              className="p-2 text-gray-500 hover:text-red-650 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-xl transition"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export default AdminPanel;
