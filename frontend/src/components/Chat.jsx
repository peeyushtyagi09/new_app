import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import PasswordModal from './PasswordModal';

// Singleton socket instance to avoid multiple connections
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_BACKEND_URL, { transports: ['websocket'] });
  }
  return socketInstance;
};

const getRandomUsername = () => 'User' + Math.floor(Math.random() * 1000);

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth0();
  const [unlocked, setUnlocked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [checkingBlock, setCheckingBlock] = useState(true);

  const getDeviceFingerprint = () => {
    return `${navigator.userAgent}|${window.screen.width}x${window.screen.height}`;
  };

  // Check block status on mount
  useEffect(() => {
    const checkBlocked = async () => {
      setCheckingBlock(true);
      setBlocked(false);
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/password/check-blocked`, {
          params: { email: user?.email },
          headers: { 'x-device-fingerprint': getDeviceFingerprint() },
        });
        if (res.data.blocked) {
          setBlocked(true);
        }
      } catch {
        setBlocked(true);
      } finally {
        setCheckingBlock(false);
      }
    };
    checkBlocked();
    // eslint-disable-next-line
  }, [user]);

  // Set username once user info is available
  useEffect(() => {
    if (authLoading) return;
    let name =
      location.state?.username ||
      (user?.email ? user.email.split('@')[0] : getRandomUsername());
    setUsername(name);
  }, [location.state, user, authLoading]);

  // Fetch previous messages and set up socket listeners
  useEffect(() => {
    if (!username) return;
    let isMounted = true;
    setLoading(true);
    setError('');
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/messages`)
      .then((res) => {
        if (isMounted) {
          setChat(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load messages.');
          setLoading(false);
        }
      });

    const s = getSocket();

    const handleReceive = (data) => {
      setChat((prev) => [...prev, data]);
    };

    s.on('receive-message', handleReceive);

    return () => {
      isMounted = false;
      s.off('receive-message', handleReceive);
    };
  }, [username]);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  // Prevent sending empty or whitespace-only messages
  const sendMessage = useCallback(() => {
    if (!message.trim() || !username) return;
    const s = getSocket();
    s.emit('send-message', { content: message.trim(), sender: username });
    setMessage('');
  }, [message, username]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle auth loading state
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold text-blue-600">Loading authentication...</h2>
        </div>
      </div>
    );
  }

  if (checkingBlock) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="mb-4 text-xl font-bold">Checking block status...</h2>
        </div>
      </div>
    );
  }

  if (!unlocked && !blocked) {
    return (
      <PasswordModal
        email={user?.email}
        onSuccess={() => setUnlocked(true)}
        onBlocked={() => setBlocked(true)}
      />
    );
  }

  if (blocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">NO ATTEMPTS LEFT</h2>
          <button
            className="mt-4 px-6 py-2 rounded bg-gray-700 text-white font-bold"
            onClick={() => navigate('/')}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '40px auto',
        background: '#f9f9f9',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '0 0 16px 0',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          background: '#4f8cff',
          color: '#fff',
          borderRadius: '12px 12px 0 0',
          padding: '18px 24px',
          fontWeight: 600,
          fontSize: '1.2rem',
          letterSpacing: '0.5px',
        }}
      >
        Real-Time Chat
        <span style={{ float: 'right', fontSize: '0.9rem', fontWeight: 400 }}>
          You: <span style={{ fontWeight: 600 }}>{username}</span>
        </span>
      </div>
      <div
        style={{
          border: 'none',
          background: '#fff',
          padding: '18px 16px 8px 16px',
          minHeight: '320px',
          maxHeight: '320px',
          overflowY: 'auto',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
            Loading messages...
          </div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '40px' }}>{error}</div>
        ) : chat.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>
            No messages yet.
          </div>
        ) : (
          chat.map((msg, index) => {
            const isOwn = msg.sender === username;
            return (
              <div
                key={msg._id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    background: isOwn ? '#4f8cff' : '#e6e6e6',
                    color: isOwn ? '#fff' : '#222',
                    borderRadius: isOwn
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    padding: '8px 14px',
                    maxWidth: '75%',
                    wordBreak: 'break-word',
                    fontSize: '1rem',
                    boxShadow: isOwn
                      ? '0 1px 4px #4f8cff22'
                      : '0 1px 4px #aaa2',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {isOwn ? 'You' : msg.sender}
                  </span>
                  <span
                    style={{
                      color: isOwn ? '#cce2ff' : '#888',
                      fontSize: '0.85em',
                      marginLeft: 8,
                    }}
                  >
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                  <div style={{ marginTop: 2 }}>{msg.content}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px 0 16px',
        }}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        autoComplete="off"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: '1px solid #d0d0d0',
            outline: 'none',
            fontSize: '1rem',
            marginRight: '10px',
            background: '#f5f7fa',
            transition: 'border 0.2s',
          }}
          maxLength={500}
          aria-label="Type a message"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          style={{
            padding: '10px 22px',
            borderRadius: '20px',
            border: 'none',
            background: message.trim() ? '#4f8cff' : '#b3cfff',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            boxShadow: message.trim() ? '0 2px 8px #4f8cff33' : 'none',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
