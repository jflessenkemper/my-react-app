import { useState, useEffect, useRef } from 'react'; // Import useEffect and useRef
import './App.css'; // This now contains all your custom styles and animations

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // useRef to hold the timeout ID for auto-logout
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clear session data from local storage and state
  const clearSession = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('loggedInUserEmail'); // Clear stored user email as well
    setIsLoggedIn(false);
    setLoggedInUserEmail(null);
    clearFormStates(); // Also clear form fields and messages
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current); // Clear any pending auto-logout
      logoutTimerRef.current = null;
    }
  };

  // Function to set session data and start auto-logout timer
  const setSession = (sessionId: string, expiresAt: string, userEmail: string) => {
    const expirationDate = new Date(expiresAt);
    const expirationMs = expirationDate.getTime() - Date.now();

    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('sessionExpiresAt', expiresAt);
    localStorage.setItem('loggedInUserEmail', userEmail); // Store email for persistence
    setIsLoggedIn(true);
    setLoggedInUserEmail(userEmail);

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    // Only set a timeout if the session is not already expired
    if (expirationMs > 0) {
      logoutTimerRef.current = setTimeout(() => {
        console.log('Session expired, logging out automatically.');
        handleLogout(sessionId); // Call logout function to clear server session
      }, expirationMs);
    } else {
      console.log('Session already expired when trying to set, clearing immediately.');
      clearSession(); // Clear if it's already past expiration
    }
  };

  // Effect to check for existing session on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedExpiresAt = localStorage.getItem('sessionExpiresAt');
    const storedUserEmail = localStorage.getItem('loggedInUserEmail');

    if (storedSessionId && storedExpiresAt && storedUserEmail) {
      const expirationDate = new Date(storedExpiresAt);
      if (expirationDate > new Date()) {
        // Session is still valid, restore it
        setSession(storedSessionId, storedExpiresAt, storedUserEmail);
      } else {
        // Session expired, clear it
        console.log('Stored session has expired, clearing it.');
        clearSession();
      }
    }
    // Cleanup function for useEffect to clear the timeout if the component unmounts
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []); // Run only once on mount

  // Clears all form-related states (email, password, errors, messages)
  const clearFormStates = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormStates(); // Clear messages before new attempt

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful!', data.user);
        setSuccessMessage('Login successful!'); // Give visual feedback
        setSession(data.sessionId, data.expiresAt, data.user.email); // Set session and timer
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
        setIsLoggedIn(false); // Ensure login status is false on error
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setError('A network error occurred. Please try again.');
      setIsLoggedIn(false); // Ensure login status is false on network error
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormStates(); // Clear messages before new attempt

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Registration successful! You can now log in.');
        clearFormStates(); // Clear form after successful registration
        setShowRegisterForm(false); // Go back to login form after successful registration
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      setError('A network error occurred during registration. Please try again.');
    }
  };

  const handleLogout = async (sessionIdToClear?: string) => {
    const currentSessionId = sessionIdToClear || localStorage.getItem('sessionId');
    if (currentSessionId) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId }),
        });
        console.log('Server session cleared.');
      } catch (error) {
        console.error('Failed to clear server session:', error);
      }
    }
    clearSession(); // Always clear client-side session regardless of server outcome
  };


  // Render logged-in state or forms
  if (isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8">
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism text-center text-gray-100">
          <h1 className="text-3xl font-bold">Welcome, {loggedInUserEmail}!</h1>
          <p className="text-gray-400">You are successfully logged in.</p>
          <button
            onClick={() => handleLogout()} // Call handleLogout directly
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 animated-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8 overflow-hidden">
        {/* Form container: Removed transition-all for form height animation */}
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center">
            {/* Added key prop to force re-render and re-trigger fade animation */}
            {/* Class name changed to text-fade-in-out */}
            <h1 key={showRegisterForm ? "register-title" : "login-title"}
                className={`text-3xl font-bold text-fade-in-out ${showRegisterForm ? 'text-gray-100' : 'bg-gradient-to-r from-cyan-400 via-white to-green-400 bg-clip-text text-transparent animated-text-gradient'}`}>
              {showRegisterForm ? 'Create Account' : 'Jump In'}
            </h1>
            {/* Added key prop to force re-render and re-trigger fade animation */}
            {/* Class name changed to text-fade-in-out */}
            <p key={showRegisterForm ? "register-subtitle" : "login-subtitle"}
               className={`text-gray-400 mt-2 text-fade-in-out`}>
              {showRegisterForm ? 'Sign up to get started.' : 'Sign in to continue to your account.'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={showRegisterForm ? handleRegister : handleLogin}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/30 text-green-300 text-sm rounded-lg p-3 text-center">
                {successMessage}
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                placeholder="Email Address"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                placeholder="Password"
                required
              />
            </div>

            {/* Remember Me / Forgot Password (Login Only) - No transition on height */}
            {/* The presence/absence of this div causes an instant height change now */}
            <div className={`${!showRegisterForm ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-gray-500 focus:ring-gray-400 border-gray-600 rounded bg-gray-900/50" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-gray-400 hover:text-gray-200">
                    Forgot your password?
                  </a>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 animated-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
              >
                {showRegisterForm ? 'Register Account' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Toggle Register/Login Link */}
          <div className="text-center mt-4">
            {showRegisterForm ? (
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setShowRegisterForm(false);
                    clearFormStates();
                  }}
                  className="font-medium text-gray-400 hover:text-gray-200 underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setShowRegisterForm(true);
                    clearFormStates();
                  }}
                  className="font-medium text-gray-400 hover:text-gray-200 underline"
                >
                  Register Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
