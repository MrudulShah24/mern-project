import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/axiosConfig";
import { Users, Book, BarChart2, Trash2, Search, X, Edit, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState({ users: true, courses: true });
  const [searchTerm, setSearchTerm] = useState({ users: "", courses: "" });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, type: null, id: null });

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

  const openDeleteModal = (type, id) => {
    setShowDeleteModal({ show: true, type, id });
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
        return <ManageUsersView users={filteredUsers} loading={loading.users} searchTerm={searchTerm.users} setSearchTerm={setSearchTerm} openDeleteModal={openDeleteModal} />;
      case "courses":
        return <ManageCoursesView courses={filteredCourses} loading={loading.courses} searchTerm={searchTerm.courses} setSearchTerm={setSearchTerm} openDeleteModal={openDeleteModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
        <div className="p-6 text-2xl font-bold text-purple-600 dark:text-purple-400 border-b dark:border-gray-700">
          EduForge Admin
        </div>
        <nav className="p-4">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 ${activeTab === 'dashboard' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <BarChart2 className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button onClick={() => setActiveTab("users")} className={`w-full flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 ${activeTab === 'users' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Users className="w-5 h-5 mr-3" /> Manage Users
          </button>
          <button onClick={() => setActiveTab("courses")} className={`w-full flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 ${activeTab === 'courses' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Book className="w-5 h-5 mr-3" /> Manage Courses
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 md:p-10">
        {renderContent()}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end mt-8 space-x-4">
              <button onClick={() => setShowDeleteModal({ show: false, type: null, id: null })} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ users, courses }) => {
    const courseData = useMemo(() => {
        const categoryCount = courses.reduce((acc, course) => {
            const category = course.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(categoryCount).map(key => ({ name: key, courses: categoryCount[key] }));
    }, [courses]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">Dashboard</h1>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center"><div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4"><Users className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p><p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{users.length}</p></div></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center"><div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full mr-4"><Book className="w-6 h-6 text-green-600 dark:text-green-400" /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p><p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{courses.length}</p></div></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center"><div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full mr-4"><Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Admins</p><p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{users.filter(u => u.role === 'admin').length}</p></div></div>
            </div>
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Courses by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={courseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                        <YAxis tick={{ fill: '#A0AEC0' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} itemStyle={{ color: '#E2E8F0' }} />
                        <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                        <Bar dataKey="courses" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const ManageUsersView = ({ users, loading, searchTerm, setSearchTerm, openDeleteModal }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Manage Users</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(prev => ({ ...prev, users: e.target.value }))} className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-80 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300 dark:placeholder-gray-500" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700"><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Role</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th></tr></thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="4" className="text-center p-8 text-gray-500 dark:text-gray-400">Loading users...</td></tr>) :
                        users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700">
                                <td className="p-4 text-gray-800 dark:text-gray-300">{user.name}</td>
                                <td className="p-4 text-gray-800 dark:text-gray-300">{user.email}</td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>{user.role || "student"}</span></td>
                                <td className="p-4 flex space-x-2">
                                    <button className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"><Edit size={18} /></button>
                                    <button onClick={() => openDeleteModal('users', user._id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ManageCoursesView = ({ courses, loading, searchTerm, setSearchTerm, openDeleteModal }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Manage Courses</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(prev => ({ ...prev, courses: e.target.value }))} className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-80 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300 dark:placeholder-gray-500" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700"><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Title</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Category</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Lessons</th><th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th></tr></thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="4" className="text-center p-8 text-gray-500 dark:text-gray-400">Loading courses...</td></tr>) :
                        courses.map((course) => (
                            <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700">
                                <td className="p-4 text-gray-800 dark:text-gray-300">{course.title}</td>
                                <td className="p-4 text-gray-800 dark:text-gray-300">{course.category || "N/A"}</td>
                                <td className="p-4 text-gray-800 dark:text-gray-300">{course.lessons?.length || 0}</td>
                                <td className="p-4 flex space-x-2">
                                    <button className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"><Edit size={18} /></button>
                                    <button onClick={() => openDeleteModal('courses', course._id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export default AdminPanel;
