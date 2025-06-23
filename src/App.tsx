import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // This now contains all your custom styles and animations

// Define a type for your Excel data row for better type safety
interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth-related states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Excel-related states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [excelData, setExcelData] = useState<ExcelRow[] | null>(null);
  const [isLoadingExcel, setIsLoadingExcel] = useState(true); // Added for initial data fetch
  const [activeTab, setActiveTab] = useState<'excel' | 'design'>('excel'); // Assuming a default active tab

  const fileInputRef = useRef<HTMLInputElement>(null); // For excel file input

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
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoadingAuth(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Login successful!');
        setSession(data.sessionId, data.sessionExpiresAt, email);
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setMessage('A network error occurred.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoadingAuth(true);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoadingAuth(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! Please log in.');
        setIsRegistering(false); // Switch back to login form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      setMessage('A network error occurred.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Excel handling functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setExcelFile(event.target.files[0]);
      setUploadError(''); // Clear any previous upload errors
      setUploadSuccess(null); // Clear any previous upload success message
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setExcelFile(event.dataTransfer.files[0]);
      setUploadError('');
      setUploadSuccess(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const fetchExcelData = async () => {
    setIsLoadingExcel(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setUploadError('Session not found. Please log in again to fetch data.');
        setIsLoadingExcel(false);
        return;
      }
      const response = await fetch('/api/get-excel-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionId}` },
        body: JSON.stringify({ sessionId })
      });
      const result = await response.json();
      if (response.ok) {
        setExcelData(result.excelData);
      } else {
        setUploadError(result.message || 'Failed to fetch Excel data.');
        setExcelData(null);
      }
    } catch (err) {
      console.error('Network error during data fetch:', err);
      setUploadError('A network error occurred while fetching data.');
      setExcelData(null);
    } finally {
      setIsLoadingExcel(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchExcelData();
    }
  }, [isLoggedIn]); // Fetch data when login status changes

  const handleUploadExcel = async () => {
    if (!excelFile) {
      setUploadError('Please select an Excel file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('excel', excelFile);

    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      formData.append('sessionId', sessionId);
    } else {
      setUploadError('Session not found. Please log in again.');
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(excelFile);

    reader.onload = async () => {
      try {
        const response = await fetch('/api/upload-excel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setUploadSuccess(data.message || 'Excel file uploaded and processed successfully!');
          setExcelFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          fetchExcelData(); // Re-fetch data after successful upload
        } else {
          setUploadError(data.message || 'Excel file upload failed.');
        }
      } catch (err) {
        console.error('Network error during Excel upload:', err);
        setUploadError('A network error occurred during upload. Please check console for details.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    };
  };

  const clearExcelData = () => {
    setExcelData(null);
  };

  if (isLoggedIn) {
    return (
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden glassmorphism-dashboard-container">
          <aside className="flex flex-row w-fit max-w-[95vw] h-auto fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800/50 custom-scrollbar glassmorphism glass-shimmer-on-hover flex-grow-0 flex-shrink-0 justify-center items-center gap-x-4 z-50 rounded-none lg:flex-col lg:h-screen lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:px-4 lg:py-6 lg:items-start lg:justify-start lg:gap-y-2 lg:border-r-4 lg:border-gray-700/50">
            <nav className="hidden lg:block w-full">
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setActiveTab('excel')} className={`flex items-center w-24 h-24 p-2 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center border border-gray-700/50 rounded-lg`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM19 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM5 12h.01M12 12h.01M19 12h.01" />
                    </svg>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLogout()} className="flex items-center w-24 h-24 p-2 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center border border-gray-700/50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>

            <nav className="flex lg:hidden w-full justify-around items-center space-x-4">
              <button onClick={() => setActiveTab('excel')} className={`flex flex-col items-center w-36 h-36 p-2 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center border border-gray-700/50 rounded-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM19 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM5 12h.01M12 12h.01M19 12h.01" />
                </svg>
              </button>
              <button onClick={() => handleLogout()} className="flex flex-col items-center w-36 h-36 p-2 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center border border-gray-700/50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </nav>
          </aside>

          <main className="flex-1 p-8 overflow-y-auto custom-scrollbar lg:pl-64">
            {activeTab === 'excel' && (
              <div className="w-full max-w-4xl mx-auto text-gray-100">
                <h2 className="text-4xl font-bold mb-6">Excel Dashboard</h2>
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
                    {isLoadingExcel ? (
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
  } else {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 p-4">
        <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl w-full max-w-md glassmorphism text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome</h1>
          <p className="text-gray-300 mb-8">
            {isRegistering ? "Create your account to get started." : "Sign in to access your dashboard."}
          </p>

          {message && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes('successful') ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {message}
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 glass-input"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 glass-input"
              />
            </div>
            {isRegistering && (
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 glass-input"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 glass-button"
            >
              {isLoadingAuth ? (
                <div className="flex items-center justify-center">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6 mr-3"></div>
                  {isRegistering ? 'Registering...' : 'Logging In...'}
                </div>
              ) : (
                isRegistering ? 'Register' : 'Login'
              )}
            </button>
          </form>
          <p className="mt-6 text-gray-400">
            {isRegistering ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  Register
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }
}