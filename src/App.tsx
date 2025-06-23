import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'; // This now contains all your custom styles and animations
import AuthPage from './pages/AuthPage';
import ExcelPage from './pages/ExcelPage';
import DesignPage from './pages/DesignPage';

// Define a type for your Excel data row for better type safety
interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSession = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('loggedInUserEmail');
    setIsLoggedIn(false);
    setLoggedInUserEmail(null);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const setSession = (sessionId: string, expiresAt: string, userEmail: string) => {
    const expirationDate = new Date(expiresAt);
    const expirationMs = expirationDate.getTime() - Date.now();

    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('sessionExpiresAt', expiresAt);
    localStorage.setItem('loggedInUserEmail', userEmail);
    setIsLoggedIn(true);
    setLoggedInUserEmail(userEmail);

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (expirationMs > 0) {
      logoutTimerRef.current = setTimeout(() => {
        console.log('Session expired, logging out automatically.');
        handleLogout(sessionId);
      }, expirationMs);
    } else {
      console.log('Stored session has expired when trying to set, clearing immediately.');
      clearSession();
    }
  };

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedExpiresAt = localStorage.getItem('sessionExpiresAt');
    const storedUserEmail = localStorage.getItem('loggedInUserEmail');

    if (storedSessionId && storedExpiresAt && storedUserEmail) {
      const expirationDate = new Date(storedExpiresAt);
      if (expirationDate > new Date()) {
        setSession(storedSessionId, storedExpiresAt, storedUserEmail);
      } else {
        console.log('Stored session has expired, clearing it.');
        clearSession();
      }
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const handleLogout = async (sessionIdToClear?: string) => {
    try {
      const sessionId = sessionIdToClear || localStorage.getItem('sessionId');
      if (!sessionId) {
        console.warn('No session ID found to logout.');
        clearSession();
        return;
      }
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        console.log('Logout successful!');
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.message);
      }
    } catch (err) {
      console.error('Network error during logout:', err);
    } finally {
      clearSession();
      navigate('/'); // Navigate to login page after logout
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-700">
        <nav className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 text-white shadow-md z-20">
          <ul className="flex justify-center space-x-6">
            <li>
              <Link to="/" className="hover:text-blue-400 transition-colors duration-200">Login</Link>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <Link to="/excel" className="hover:text-blue-400 transition-colors duration-200">Excel</Link>
                </li>
                <li>
                  <button onClick={() => handleLogout()} className="hover:text-blue-400 transition-colors duration-200 bg-transparent border-none cursor-pointer text-white p-0">
                    Logout
                  </button>
                </li>
              </>
            )}
            <li>
              <Link to="/design" className="hover:text-blue-400 transition-colors duration-200">Design Reference</Link>
            </li>
          </ul>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <AuthPage
                setIsLoggedIn={setIsLoggedIn}
                setLoggedInUserEmail={setLoggedInUserEmail}
                setActiveTab={(tab) => navigate(`/${tab}`)}
              />
            } />
            <Route
              path="/excel"
              element={
                isLoggedIn ? (
                  <ExcelPage
                    isLoggedIn={isLoggedIn}
                    loggedInUserEmail={loggedInUserEmail}
                    handleLogout={handleLogout}
                  />
                ) : (
                  <AuthPage
                    setIsLoggedIn={setIsLoggedIn}
                    setLoggedInUserEmail={setLoggedInUserEmail}
                    setActiveTab={(tab) => navigate(`/${tab}`)}
                  />
                )
              }
            />
            <Route path="/design" element={<DesignPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}