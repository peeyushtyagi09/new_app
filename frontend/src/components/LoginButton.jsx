import React, { useCallback, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginButton = ({ onLogin }) => {
  const { loginWithPopup, user, isAuthenticated, isLoading, error } = useAuth0();

  // Handles login popup
  const handleLogin = useCallback(async () => {
    try {
      await loginWithPopup();
      // Auth0 updates user/isAuthenticated asynchronously
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', e);
    }
  }, [loginWithPopup]);

  // Call onLogin with best username when authenticated
  useEffect(() => {
    if (isAuthenticated && user && onLogin) {
      let username = 'User';
      if (user.nickname) {
        username = user.nickname;
      } else if (user.email) {
        username = user.email.split('@')[0];
      } else if (user.name) {
        username = user.name;
      }
      onLogin(username);
    }
  }, [isAuthenticated, user, onLogin]);

  if (isLoading) {
    return (
      <button
        disabled
        className="px-6 py-3 rounded-lg bg-gray-400 text-white font-bold shadow"
        type="button"
      >
        Loading...
      </button>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 font-bold">
        Authentication Error: {error.message}
      </div>
    );
  }

  if (isAuthenticated) {
    // Optionally, you could show a logout button here
    return null;
  }

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold shadow hover:bg-emerald-700 transition"
      type="button"
    >
      Login with Google
    </button>
  );
};

export default LoginButton;