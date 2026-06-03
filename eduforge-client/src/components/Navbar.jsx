import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, BookOpen, User, LogOut, Shield, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
    return null;
  }
};

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const user = getStoredUser();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHomePage ? 'backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border-b border-amber-100/50 dark:border-amber-500/15 shadow-[0_12px_40px_rgba(5,10,20,0.25)]' : 'bg-transparent'}`;
  const linkClasses = `font-medium transition ${isScrolled || !isHomePage ? 'text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-300' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`;
  const brandClasses = `text-2xl md:text-3xl font-bold font-display ${isScrolled || !isHomePage ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent' : 'text-gray-950 dark:text-white'}`;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand */}
          <Link to={user ? "/dashboard" : "/"} className={brandClasses}>
            EduForge
          </Link>

          {/* Desktop Search & Links */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for courses..."
                className="w-64 rounded-full border border-amber-100/70 bg-white/80 py-2 px-4 text-sm text-gray-900 shadow-sm transition focus:ring-2 focus:ring-amber-400/60 dark:border-amber-500/20 dark:bg-slate-900/70 dark:text-gray-100"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <Link to="/courses" className={linkClasses}>
              Courses
            </Link>
          </div>

          {/* Auth & Profile */}
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className={`p-2 rounded-full ${isScrolled || !isHomePage ? 'text-gray-700 dark:text-gray-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/10' : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/20'}`}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2">
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-10 h-10 rounded-full" />
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-amber-100/60 bg-white/80 py-2 shadow-[0_18px_45px_rgba(140,90,10,0.2)] backdrop-blur-xl dark:border-amber-500/15 dark:bg-slate-900/75">
                    <Link to="/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/10">
                      <LayoutDashboard className="w-5 h-5 mr-2" /> Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/10">
                      <User className="w-5 h-5 mr-2" /> Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/10">
                        <Shield className="w-5 h-5 mr-2" /> Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-red-500 hover:bg-red-500/10">
                      <LogOut className="w-5 h-5 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className={`px-4 py-2 font-medium rounded-lg transition ${isScrolled || !isHomePage ? 'text-gray-700 dark:text-gray-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/10' : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/20'}`}>
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-lg hover:brightness-105 transition shadow-[0_12px_30px_rgba(255,160,70,0.35)]">
                  Register
                </Link>
              </div>
            )}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className={`${isScrolled || !isHomePage ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-white'}`}>
                <Menu size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 z-50 md:hidden backdrop-blur-xl">
          <div className="flex justify-between items-center p-4 border-b border-amber-100/60 dark:border-amber-500/15">
            <Link to={user ? "/dashboard" : "/"} className="text-2xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">EduForge</Link>
            <button onClick={() => setIsMobileMenuOpen(false)}><X size={28} /></button>
          </div>
          <div className="p-4">
            <Link to="/courses" className="block py-2 text-lg">Courses</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 text-lg">Dashboard</Link>
                <Link to="/profile" className="block py-2 text-lg">Profile</Link>
                {user.role === 'admin' && <Link to="/admin" className="block py-2 text-lg">Admin</Link>}
                <button onClick={handleLogout} className="w-full text-left py-2 text-lg text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-lg">Login</Link>
                <Link to="/register" className="block w-full text-center mt-4 py-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-slate-900 font-semibold rounded-lg">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
