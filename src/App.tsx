import { useState, useEffect, useRef } from 'react';
import './App.css'; // This now contains all your custom styles and animations

// Define a type for your Excel data row for better type safety
interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for global loading indicator (for login/register/initial Excel fetch)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'experiments'>('dashboard'); // State for active tab

  // States for Excel upload functionality
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Specific loading for Excel upload
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [excelData, setExcelData] = useState<ExcelRow[] | null>(null); // State to store fetched Excel data

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

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
    // Only set a timeout if the session is not already expired and is positive
    if (expirationMs > 0) {
      logoutTimerRef.current = setTimeout(() => {
        console.log('Session expired, logging out automatically.');
        handleLogout(sessionId); // Call logout function to clear server session
      }, expirationMs);
    } else {
      console.log('Stored session has expired when trying to set, clearing immediately.');
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
        setSession(storedSessionId, storedExpiresAt, storedUserEmail);
      } else {
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

  // Effect to fetch Excel data when Experiments tab is active and user is logged in
  useEffect(() => {
    const fetchExcelData = async () => {
      if (activeTab === 'experiments' && isLoggedIn) {
        setUploadError('');
        setUploadSuccess('');
        setIsLoading(true); // Use global loading for fetching Excel data
        const sessionId = localStorage.getItem('sessionId');

        if (!sessionId) {
          setError('Session not found. Please log in again.');
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch('/api/get-excel-data', {
            method: 'POST', // Using POST to send sessionId securely in body
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionId}` // Optional: more standard way to send token
            },
            body: JSON.stringify({ sessionId })
          });

          const data = await response.json();

          if (response.ok) {
            setExcelData(data.excelData);
          } else {
            setUploadError(data.message || 'Failed to fetch Excel data.');
            setExcelData(null);
          }
        } catch (err) {
          console.error('Network error fetching Excel data:', err);
          setUploadError('Network error fetching Excel data.');
          setExcelData(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear Excel data if not on experiments tab or not logged in
        setExcelData(null);
      }
    };

    fetchExcelData();
  }, [activeTab, isLoggedIn]); // Re-fetch if tab changes or login status changes

  // Clears all form-related states (email, password, errors, messages)
  const clearFormStates = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormStates();
    setIsLoading(true); // Start global loading

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
        setActiveTab('dashboard'); // Go to dashboard after login
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setError('A network error occurred. Please try again.');
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false); // End global loading
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormStates();
    setIsLoading(true); // Start global loading

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
        setShowRegisterForm(false); // Go back to login form after successful registration
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      setError('A network error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false); // End global loading
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

  // --- Excel Upload Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setExcelFile(event.target.files[0]);
      setUploadError('');
      setUploadSuccess('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setExcelFile(event.dataTransfer.files[0]);
      setUploadError('');
      setUploadSuccess('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      setUploadError('Please select an Excel file to upload.');
      return;
    }

    setIsUploading(true); // Start specific upload loading
    setUploadError('');
    setUploadSuccess('');
    setExcelData(null); // Clear previous data display while new file is uploaded
    const sessionId = localStorage.getItem('sessionId');

    if (!sessionId) {
      setUploadError('Session not found. Please log in again.');
      setIsUploading(false);
      return;
    }

    // Read the file as an ArrayBuffer, then convert to Base64
    const reader = new FileReader();
    reader.readAsArrayBuffer(excelFile);

    reader.onload = async (event) => {
      if (!event.target?.result) {
        setUploadError('Failed to read file.');
        setIsUploading(false);
        return;
      }

      const arrayBuffer = event.target.result as ArrayBuffer;
      const base64String = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const formData = new FormData();
      formData.append('excelFileBase64', base64String); // Send as Base64 string
      formData.append('fileName', excelFile.name); // Send filename separately
      formData.append('sessionId', sessionId);

      try {
        const response = await fetch('/api/upload-excel', {
          method: 'POST',
          body: formData, // Browser sets Content-Type: multipart/form-data with boundary
        });

        const data = await response.json();

        if (response.ok) {
          setUploadSuccess(data.message || 'Excel file uploaded and processed successfully!');
          setExcelFile(null); // Clear file input preview
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear actual file input element
          }
          // After successful upload, re-fetch the latest data for this user
          const fetchResponse = await fetch('/api/get-excel-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionId}` },
              body: JSON.stringify({ sessionId })
          });
          const fetchResult = await fetchResponse.json();
          if (fetchResponse.ok) {
              setExcelData(fetchResult.excelData);
          } else {
              setUploadError(fetchResult.message || 'Failed to refresh Excel data after upload.');
          }

        } else {
          setUploadError(data.message || 'Excel file upload failed.');
        }
      } catch (err) {
        console.error('Network error during Excel upload:', err);
        setUploadError('A network error occurred during upload. Please check console for details.');
      } finally {
        setIsUploading(false); // End specific upload loading
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    };
  };


  // --- Render Dashboard Layout if Logged In ---
  if (isLoggedIn) {
    return (
      // Main container for the entire application, spaced from edges and rounded
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex flex-1 rounded-2xl overflow-hidden glassmorphism-dashboard-container"> {/* Apply glassmorphism to the entire dashboard area */}
          {/* Sidebar */}
          {/* Removed Mintify Bites, moved Experiments/Logout to top, condensed width */}
          <aside className="flex flex-col w-24 bg-gray-800/50 p-2 custom-scrollbar glassmorphism">
            {/* New: Experiments Tab */}
            <div className="mb-auto"> {/* Pushes other content down */}
              <button
                onClick={() => setActiveTab('experiments')}
                className={`w-full flex items-center justify-center py-2 px-1 rounded-lg transition-colors text-sm ${
                  activeTab === 'experiments' ? 'bg-green-600 text-white' : 'hover:bg-gray-700 text-gray-200'
                }`}
                title="Experiments" // Tooltip for icon-only button
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-1-3m-6.938-9L2 7m9.593-1.593a2.5 2.5 0 113.536 3.536L14.5 13.5 19 18l-1-1h4V9l-4-4m-7 7L9 10" />
                </svg>
                {/* No "Experiments" text here as requested for condensed bar, relying on tooltip */}
              </button>
            </div>

            {/* Logout Button in Sidebar - text removed, icon-only */}
            <div className="pt-2">
              <button
                onClick={() => handleLogout()}
                className="w-full flex items-center justify-center py-2 px-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm"
                title="Logout" // Tooltip for icon-only button
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {/* No "Logout" text here as requested */}
              </button>
            </div>

          </aside>

          {/* Main Content Area (right side) */}
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
            {/* Conditional rendering for content based on activeTab */}
            {activeTab === 'dashboard' && (
              <div className="w-full max-w-4xl mx-auto text-gray-100">
                <h2 className="text-4xl font-bold mb-6">Dashboard Overview</h2>
                <p className="text-gray-400">Your central hub for quick insights.</p>
                <div className="mt-8 bg-gray-800/50 p-6 rounded-lg glassmorphism-thin">
                  <h3 className="text-xl font-semibold mb-2">General Information</h3>
                  <p className="text-gray-300 text-sm">
                    This section will contain summarized data and key performance indicators relevant to your account.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'experiments' && (
              <div className="w-full max-w-4xl mx-auto text-gray-100">
                <h2 className="text-4xl font-bold mb-6">Experiments</h2>
                <div className="bg-gray-800/50 p-6 rounded-lg glassmorphism">
                  {uploadError && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 mb-4 text-center">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-300 text-sm rounded-lg p-3 mb-4 text-center">
                      {uploadSuccess}
                    </div>
                  )}

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                      <p className="text-gray-300 text-lg">Uploading and Processing Excel File...</p>
                    </div>
                  ) : (
                    <>
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-500 rounded-lg p-10 text-center text-gray-400 hover:border-green-500 hover:text-green-300 transition-colors cursor-pointer"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".xlsx, .xls"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6H16a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h.5M7 16l3-3m0 0l3 3m-3-3v8m-3-4h6" />
                        </svg>
                        <p className="text-lg font-semibold">Drag & Drop your Excel file here, or click to browse</p>
                        {excelFile && <p className="mt-2 text-gray-300">Selected file: {excelFile.name}</p>}
                      </div>
                      {excelFile && (
                        <button
                          onClick={handleUploadExcel}
                          className="w-full mt-4 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-bold"
                        >
                          Upload Selected File
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Display Excel Data */}
                {excelData && excelData.length > 0 ? (
                  <div className="mt-8 bg-gray-800/50 p-6 rounded-lg glassmorphism-thin overflow-x-auto custom-scrollbar">
                    <h3 className="text-xl font-semibold mb-4">Uploaded Data (First Sheet)</h3>
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          {Object.keys(excelData[0]).map((key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {excelData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-700 transition-colors">
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                {value !== null && value !== undefined ? String(value) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-8 text-gray-400 text-center">
                    {isLoading ? (
                      <p>Loading previous Excel data...</p>
                    ) : (
                      <p>No Excel data uploaded yet for this user.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // --- Render Login/Register Form if Not Logged In ---
  return (
    <>
      <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8 overflow-hidden">
        <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism">
          {isLoading ? ( // Conditional rendering based on isLoading state
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]"> {/* min-h to prevent layout shift */}
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
                    className={`text-3xl font-bold text-fade-in-out text-gray-100`}> {/* Removed gradient and animation classes, made white */}
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
