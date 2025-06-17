import { useState } from 'react';
import './App.css';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state to track login status
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null); // To display logged-in user

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful!', data.user);
        setIsLoggedIn(true); // Set login status to true
        setLoggedInUserEmail(data.user.email); // Store user email
        // In a real app, you might redirect to a dashboard or set a global auth context
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

  // If the user is logged in, display a welcome message instead of the form
  if (isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism text-center text-gray-100">
          <h1 className="text-3xl font-bold">Welcome, {loggedInUserEmail}!</h1>
          <p className="text-gray-400">You are successfully logged in.</p>
          {/* You can add a logout button or navigate to a different route here */}
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setLoggedInUserEmail(null);
              setEmail('');
              setPassword('');
              setError('');
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 animated-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // If not logged in, display the login form
  return (
    <>
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-100">Welcome</h1>
            <p className="text-gray-400 mt-2">Sign in to continue to your account.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 text-center">
                {error}
              </div>
            )}
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

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 animated-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
