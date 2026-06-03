import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      try {
        // Save token to localStorage
        localStorage.setItem('token', token);
        
        // Decode JWT token helper to get user ID
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const userId = decoded.id;

        if (!userId) {
          throw new Error('No user ID found in token');
        }

        // Fetch user data from backend (interceptor will automatically add Bearer token)
        api.get(`/users/${userId}`)
          .then((res) => {
            if (res.data) {
              localStorage.setItem('user', JSON.stringify(res.data));
              // Redirect to dashboard
              navigate('/dashboard');
            } else {
              throw new Error('Empty user details returned');
            }
          })
          .catch((err) => {
            console.error('Failed to retrieve user info:', err);
            navigate('/login?error=oauth_failed');
          });

      } catch (err) {
        console.error('Failed to process authentication token:', err);
        navigate('/login?error=oauth_failed');
      }
    } else {
      // If no token, authentication failed
      navigate('/login?error=oauth_failed');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15),_transparent_60%)] pointer-events-none" />
      <div className="text-center relative z-10">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
        <p className="text-white/60">Please wait while we log you in safely.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
