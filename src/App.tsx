import { useState } from 'react';
import './App.css'; // Assuming this contains your glassmorphism and other styles

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // New state for registration success
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false); // New state to toggle views

  // Clears all form-related states
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
        setIsLoggedIn(true);
        setLoggedInUserEmail(data.user.email);
        clearFormStates(); // Clear form after successful login
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setError('A network error occurred. Please try again.');
      setIsLoggedIn(false);
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

  // If the user is logged in, display a welcome message instead of the form
  if (isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8"> {/* Adjusted for full screen on mobile */}
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism text-center text-gray-100">
          <h1 className="text-3xl font-bold">Welcome, {loggedInUserEmail}!</h1>
          <p className="text-gray-400">You are successfully logged in.</p>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setLoggedInUserEmail(null);
              clearFormStates(); // Reset all form states
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 animated-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Render Login or Register Form
  return (
    <>
      {/* Main container: Centered flexbox, takes full viewport height and width on all devices */}
      {/* On small screens, padding is `p-4`, increasing to `sm:p-8` for larger screens. */}
      {/* `h-screen` ensures full viewport height, `overflow-hidden` prevents scrolling of the entire page. */}
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8 overflow-hidden">
        {/* Form container: `w-full` on mobile, `max-w-md` (limited width) on medium and larger screens */}
        {/* Added transition-all for smooth size changes */}
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism transition-all duration-500 ease-in-out">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center">
            {/* Conditional classes for text animation */}
            <h1 className={`text-3xl font-bold transition-opacity duration-300 ease-in-out animated-text-fade ${showRegisterForm ? 'text-gray-100' : 'bg-gradient-to-r from-cyan-400 via-white to-green-400 bg-clip-text text-transparent animated-text-gradient'}`}>
              {showRegisterForm ? 'Create Account' : 'Jump In'}
            </h1>
            <p className={`text-gray-400 mt-2 transition-opacity duration-300 ease-in-out animated-text-fade`}>
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

            {/* Remember Me / Forgot Password (Login Only) */}
            {/* Added transition-all to this container for smooth hiding/showing */}
            <div className={`transition-all duration-500 ease-in-out ${!showRegisterForm ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
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
