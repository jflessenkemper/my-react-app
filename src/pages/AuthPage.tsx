import React, { useState, useEffect, useRef } from 'react';

interface ExcelRow {
  [key: string]: any;
}

interface AuthPageProps {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setLoggedInUserEmail: (email: string | null) => void;
  setActiveTab: (tab: 'excel' | 'excel') => void;
}

export default function AuthPage({ setIsLoggedIn, setLoggedInUserEmail, setActiveTab }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearFormStates = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMessage(null);
    setEmailError(false);
    setPasswordError(false);
  };

  const clearSession = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('loggedInUserEmail');
    setIsLoggedIn(false);
    setLoggedInUserEmail(null);
    clearFormStates();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!email) {
      setEmailError(true);
      hasError = true;
    }
    if (!password) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful!', data.user);
        setSuccessMessage('Login successful!');
        setSession(data.sessionId, data.expiresAt, data.user.email);
        setActiveTab('excel');
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setError('A network error occurred. Please try again.');
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!email) {
      setEmailError(true);
      hasError = true;
    }
    if (!password) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Registration successful! You can now log in.');
        clearFormStates();
        setShowRegisterForm(false);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      setError('A network error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (sessionIdToClear?: string) => {
    setIsLoading(true);
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
        setSuccessMessage('Logged out successfully.');
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.message);
        setError(data.message || 'Logout failed.');
      }
    } catch (err) {
      console.error('Network error during logout:', err);
      setError('Network error during logout.');
    } finally {
      clearSession();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 w-full max-w-md border border-white/20 relative z-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white drop-shadow-lg">
          {showRegisterForm ? 'Register' : 'Login'}
        </h1>

        {/* Conditional Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-center text-sm sm:text-base animate-slide-down">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-center text-sm sm:text-base animate-slide-down">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={showRegisterForm ? handleRegister : handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`w-full p-3 rounded-lg bg-white/5 border ${emailError ? 'border-red-500' : 'border-white/20'} focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-400' : 'focus:ring-blue-400'} focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom`}
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false); // Clear error on change
              }}
              onFocus={() => setError(null)} // Clear global error on focus
            />
            {emailError && <p className="text-red-300 text-xs mt-1">Email cannot be empty.</p>}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`w-full p-3 rounded-lg bg-white/5 border ${passwordError ? 'border-red-500' : 'border-white/20'} focus:outline-none focus:ring-2 ${passwordError ? 'focus:ring-red-400' : 'focus:ring-blue-400'} focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom`}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false); // Clear error on change
              }}
              onFocus={() => setError(null)} // Clear global error on focus
            />
            {passwordError && <p className="text-red-300 text-xs mt-1">Password cannot be empty.</p>}
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 glass-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full border-white border-r-transparent mr-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading...
                </div>
              ) : (
                showRegisterForm ? 'Register Account' : 'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              clearFormStates(); // Clear form and messages when switching
            }}
            className="text-blue-300 hover:text-blue-100 text-sm transition duration-300 ease-in-out glass-text-button"
            disabled={isLoading}
          >
            {showRegisterForm ? 'Already have an account? Sign In' : 'Don\'t have an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
}