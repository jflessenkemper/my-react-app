import { useState, useEffect, useRef } from 'react';
import './App.css'; // This now contains all your custom styles and animations

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const clearFormStates = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormStates();
    setIsLoading(true);

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
    clearFormStates();
    setIsLoading(true);

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
    clearSession();
  };

  // --- Render Dashboard Layout if Logged In ---
  if (isLoggedIn) {
    return (
      <div className="flex h-screen w-full overflow-hidden"> {/* flex container for sidebar and main content */}
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-gray-800 p-4 shadow-xl overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar */}
          {/* Top Section: Logo and Staff */}
          <div className="mb-8 flex items-center p-2 rounded-lg bg-gray-700/50">
            <svg className="h-8 w-8 text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 0012 21a12.001 12.001 0 008.618-18.016z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-gray-100 leading-tight">Mintify Bites</h2>
              <p className="text-gray-400 text-xs">12 staff</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search anything"
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Main Navigation */}
          <nav className="mb-6 space-y-2">
            {[
              { name: 'Dashboard', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M20 10v10a1 1 0 01-1 1h-3M7 21h10a1 1 0 001-1V9.414a1 1 0 00-.293-.707l-1.414-1.414A1 1 0 0015.414 7H8.586a1 1 0 00-.707.293L6.293 8.586A1 1 0 006 9.414V21a1 1 0 001 1z"/>' },
              { name: 'Notifications', count: 3, icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' },
              { name: 'Tasks', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>' },
              { name: 'Settings', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' },
            ].map(item => (
              <a
                key={item.name}
                href="#"
                className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
              >
                <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{ __html: item.icon }}></svg>
                {item.name}
                {item.count && (
                  <span className="ml-auto bg-green-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Workspace Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-gray-400 mb-2 px-3">
              <span className="text-xs uppercase font-semibold">Workspace</span>
              <button className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {[
                { name: 'Documents', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' },
                { name: 'Emails', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' },
                { name: 'Projects', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10"/>' },
                { name: 'Calendar', icon: '<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
              ].map(item => (
                <a
                  key={item.name}
                  href="#"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{ __html: item.icon }}></svg>
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* Teamspace Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-gray-400 mb-2 px-3 cursor-pointer">
              <span className="text-xs uppercase font-semibold">Teamspace</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <nav className="space-y-2">
              {[
                { name: 'Project management' },
                { name: 'Engineering' },
                { name: 'Design' },
              ].map(item => (
                <a
                  key={item.name}
                  href="#"
                  className="block px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* Labels Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-gray-400 mb-2 px-3 cursor-pointer">
              <span className="text-xs uppercase font-semibold">Labels</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <nav className="space-y-2">
              {[
                { name: 'Black Friday', color: 'bg-yellow-500' },
                { name: 'Launch', color: 'bg-blue-500' },
                { name: 'Marketing', color: 'bg-red-500' },
                { name: 'Big campaign', color: 'bg-purple-500' },
              ].map(item => (
                <a
                  key={item.name}
                  href="#"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                >
                  <span className={`w-2 h-2 ${item.color} rounded-full mr-2`}></span>
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* Logout Button in Sidebar */}
          <div className="mt-auto pt-4 border-t border-gray-700"> {/* mt-auto pushes it to the bottom */}
            <button
              onClick={() => handleLogout()}
              className="w-full flex items-center justify-center py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

        </aside>

        {/* Main Content Area (right side) */}
        {/* On smaller screens (md:hidden), the main content area will take full width when sidebar is hidden */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar */}
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-gray-100">Welcome to your Dashboard, {loggedInUserEmail}!</h2>
            <p className="text-gray-400">This is where your main application content will go.</p>
            {/* Example content */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg glassmorphism-thin">
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Project Overview</h3>
                <p className="text-gray-300 text-sm">
                  For the "Black Friday 24 Big Campaign" we provide the strategic oversight of a complex marketing management. Each stakeholder - from the marketing teams, client support, or fulfillment - gets a tailored view of their responsibilities while staying updated on the overall progress.
                </p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg glassmorphism-thin">
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Project Scope & Prioritization</h3>
                <p className="text-gray-300 text-sm">
                  1. Intelligent Task & Deal Management: Personal-to-Team Flow, Dynamic Deals Board.
                  Black Friday campaigns are time-bound, high-stakes events that involve numerous stakeholders: marketing teams, client support, and fulfillment.
                </p>
              </div>
            </div>
            {/* ... more dashboard content will go here ... */}
          </div>
        </main>
      </div>
    );
  }

  // --- Render Login/Register Form if Not Logged In ---
  return (
    <>
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8 overflow-hidden">
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
              <p className="text-gray-300 text-lg">Processing...</p>
            </div>
          ) : (
            <>
              {/* Lock Icon */}
              <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-center">
                <h1 key={showRegisterForm ? "register-title" : "login-title"}
                    className={`text-3xl font-bold text-fade-in-out ${showRegisterForm ? 'text-gray-100' : 'bg-gradient-to-r from-cyan-400 via-white to-green-400 bg-clip-text text-transparent animated-text-gradient'}`}>
                  {showRegisterForm ? 'Create Account' : 'Jump In'}
                </h1>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
