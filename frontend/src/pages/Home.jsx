import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

import bgImage from '/Home.image.png';
import LoginButton from '../components/LoginButton';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, error } = useAuth0();
  const [showLogin, setShowLogin] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(false);

  const getDeviceFingerprint = () => {
    return `${navigator.userAgent}|${window.screen.width}x${window.screen.height}`;
  };

  // Handle navigation to chat, extracting username from Auth0 user or fallback
  const handleStartChat = async () => {
    setCheckingBlock(true);
    setBlocked(false);
    try {
      const res = await axios.get('http://localhost:5000/api/password/check-blocked', {
        params: { email: user?.email },
        headers: { 'x-device-fingerprint': getDeviceFingerprint() },
      });
      if (res.data.blocked) {
        setBlocked(true);
        setShowLogin(false);
        setCheckingBlock(false);
        return;
      }
      setCheckingBlock(false);
      if (!isAuthenticated) {
        setShowLogin(true);
      } else {
        const username = user?.email ? user.email.split('@')[0] : 'User';
        navigate('/chat', { state: { username } });
      }
    } catch {
      setCheckingBlock(false);
      setBlocked(true);
    }
  };

  // Handle login from custom login modal (for unauthenticated users)
  const handleLogin = (username) => {
    setShowLogin(false);
    if (username && username.trim()) {
      navigate('/chat', { state: { username: username.trim() } });
    }
  };

  // Loading and error states for Auth0
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="text-lg text-gray-700">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="text-lg text-red-600">Authentication Error: {error.message}</span>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{
        background: `url(${bgImage}) center center/cover no-repeat`,
        overflow: 'hidden',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/20 to-black/10 pointer-events-none" />

      {/* App name at top-left */}
      <div className="absolute z-20 flex items-center top-6 left-6 sm:top-8 sm:left-8">
        <span className="text-white font-bold text-2xl sm:text-3xl md:text-4xl drop-shadow-lg tracking-wide select-none">
          ChatApp
        </span>
      </div>

      {/* Centered content for all devices */}
      <div
        className="
          absolute z-20 left-1/2 bottom-8 sm:bottom-16
          transform -translate-x-1/2
          w-[92vw] max-w-xl
          px-4 py-8
          bg-white/30
          backdrop-blur-xl
          rounded-2xl
          shadow-2xl
          flex flex-col items-center justify-center
          transition-all
        "
      >
        <h1 className="text-gray-900 font-extrabold text-2xl sm:text-3xl md:text-4xl mb-6 text-center drop-shadow-md tracking-wide">
          Welcome to <span className="text-primary">ChatApp</span>
        </h1>
        <button
          onClick={handleStartChat}
          className="
            px-8 py-4
            text-lg sm:text-xl font-bold
            rounded-full
            bg-gradient-to-r from-emerald-400 to-gray-900
            text-white
            shadow-lg
            hover:scale-105 hover:shadow-2xl
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-emerald-300
            active:scale-95
          "
        >
          Start Chat
        </button>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center min-w-[260px]">
              <h2 className="mb-4 text-xl font-bold">Login to continue</h2>
              <LoginButton onLogin={handleLogin} />
              <button
                className="mt-4 text-sm text-gray-500 hover:underline"
                onClick={() => setShowLogin(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {blocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
              <h2 className="mb-4 text-2xl font-bold text-red-600">NO ATTEMPTS LEFT</h2>
              <div className="text-gray-600 text-center">
                You have been blocked from accessing the chat with this Gmail/device.<br />
                Please contact support if you believe this is a mistake.
              </div>
            </div>
          </div>
        )}
        {checkingBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
              <h2 className="mb-4 text-xl font-bold">Checking block status...</h2>
            </div>
          </div>
        )}
      </div>

      {/* Responsive: move app name and content for very small screens */}
      <style>
        {`
          @media (max-width: 480px) {
            .top-6 { top: 1rem !important; }
            .left-6 { left: 1rem !important; }
            .w-\\[92vw\\] { width: 98vw !important; }
            .px-4 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
            .py-8 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
          }
        `}
      </style>
    </div>
  );
};

export default Home;
