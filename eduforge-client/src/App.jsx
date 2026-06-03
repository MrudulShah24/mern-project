import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AIStudyBuddy from './components/AIStudyBuddy';

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
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="relative min-h-screen text-gray-900 dark:text-gray-100">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,#fcfbf9_0%,#f8f6f1_45%,#f1ede4_100%)] dark:bg-[linear-gradient(180deg,#05070d_0%,#0b0f1a_55%,#05070d_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.06),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,170,70,0.18),_transparent_55%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
          <Navbar />
          {/* Add padding-top to avoid overlap with fixed navbar (h-20 ~ 80px) */}
          <div className="pt-24">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />

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
          <AIStudyBuddy />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
