import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetails from './pages/CourseDetails';
import CreateCourse from './pages/CreateCourse';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import Certificate from './components/Certificate';
import EnrollPage from './pages/EnrollPage';
import CourseDashboard from './pages/CourseDashboard';
import ProgressPage from './pages/ProgressPage';
import CertificatePage from './pages/CertificatePage';
import CertificateVerification from './pages/CertificateVerification';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
          <Navbar />
          {/* Add padding-top to avoid overlap with fixed navbar (h-20 ~ 80px) */}
          <div className="pt-24">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Protected for logged-in users */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
              <Route path="/courses/:id" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
              <Route path="/enroll/:courseId" element={<ProtectedRoute><EnrollPage /></ProtectedRoute>} />
              <Route path="/course-dashboard/:courseId" element={<ProtectedRoute><CourseDashboard /></ProtectedRoute>} />
              <Route path="/progress/:courseId" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/certificate/:courseId" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
              <Route path="/verify/:certificateId" element={<CertificateVerification />} />

              {/* Admin-only */}
              <Route path="/create-course" element={<ProtectedRoute role="admin"><CreateCourse /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
