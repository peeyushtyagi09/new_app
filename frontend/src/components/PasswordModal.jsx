import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MAX_ATTEMPTS = 3;

const PasswordModal = ({ email, onSuccess, onBlocked }) => {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // If blocked or attempts exceeded, call onBlocked if provided
  useEffect(() => {
    if ((blocked || attempts >= MAX_ATTEMPTS) && typeof onBlocked === 'function') {
      onBlocked();
    }
    // eslint-disable-next-line
  }, [blocked, attempts, onBlocked]);

  const getDeviceFingerprint = () => {
    // Simple device fingerprint for demo purposes
    return `${navigator.userAgent}|${window.screen.width}x${window.screen.height}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/password/check',
        { password, email },
        {
          headers: {
            'x-device-fingerprint': getDeviceFingerprint(),
          },
        }
      );
      if (res.data && res.data.success) {
        setPassword('');
        setAttempts(0);
        setError('');
        setBlocked(false);
        if (typeof onSuccess === 'function') onSuccess();
        return;
      }
      // If not success, treat as error
      setAttempts((a) => a + 1);
      setError('Unknown error');
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.blocked) {
          setBlocked(true);
          setError('NO ATTEMPTS LEFT');
        } else {
          setAttempts((a) => a + 1);
          setError(err.response.data.message || 'Incorrect password');
        }
      } else {
        setError('Server error. Please try again.');
      }
    } finally {
      setPassword('');
      setLoading(false);
    }
  };

  // Prevent attempts from going above MAX_ATTEMPTS
  useEffect(() => {
    if (attempts > MAX_ATTEMPTS) {
      setAttempts(MAX_ATTEMPTS);
    }
  }, [attempts]);

  if (blocked || attempts >= MAX_ATTEMPTS) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">NO ATTEMPTS LEFT</h2>
          <div className="text-gray-600 text-center">
            You have been blocked from accessing the chat.<br />
            Please contact support if you believe this is a mistake.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center"
        autoComplete="off"
      >
        <h2 className="mb-4 text-xl font-bold">Enter 4-digit password</h2>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          value={password}
          onChange={(e) => {
            // Only allow digits, max 4
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPassword(val);
            setError('');
          }}
          maxLength={4}
          className="mb-4 px-4 py-2 border rounded text-lg text-center w-32"
          placeholder="••••"
          autoFocus
          disabled={loading}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          type="submit"
          className={`px-6 py-2 rounded bg-emerald-600 text-white font-bold shadow hover:bg-emerald-700 transition ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={password.length !== 4 || loading}
        >
          {loading ? 'Checking...' : 'Unlock Chat'}
        </button>
        <div className="mt-2 text-sm text-gray-500">
          Attempts left: {Math.max(0, MAX_ATTEMPTS - attempts)}
        </div>
      </form>
    </div>
  );
};

export default PasswordModal;