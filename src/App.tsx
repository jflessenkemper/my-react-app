import { useState, useEffect, useRef } from 'react';
import './App.css'; // This now contains all your custom styles and animations

// Define a type for your Excel data row for better type safety
interface ParsedExcelData {
  frequency_interval: string[];
  income_source_1: string;
  income_source_1_values: number[];
  income_source_2: string;
  income_source_2_values: number[];
  income_total_label: string;
  income_totals: number[];
  expense_categories: string[];
  expense_values: number[][]; // Assuming this is an array of arrays for rows x columns
  expense_total_label: string;
  expense_totals: number[];
  profit_loss_section_label: string;
  profit_loss_label: string;
  profit_loss_values: number[];
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for global loading indicator (for login/register/initial Excel fetch)
  const [emailError, setEmailError] = useState(false); // New state for email validation error
  const [passwordError, setPasswordError] = useState(false); // New state for password validation error

  // New states for password reset functionality
  const [showPasswordResetRequestForm, setShowPasswordResetRequestForm] = useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [activeTab, setActiveTab] = useState<'excel' | 'excel'>('excel'); // State for active tab

  // States for Excel upload functionality
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Specific loading for Excel upload
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ParsedExcelData | null>(null); // State to store fetched Excel data

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showExcelUploadInterface, setShowExcelUploadInterface] = useState(false); // New state for Excel upload interface

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

  // Effect to fetch Excel data when Excel tab is active and user is logged in
  useEffect(() => {
    const fetchExcelData = async () => {
      if (activeTab === 'excel' && isLoggedIn) {
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
        // Clear Excel data if not on Excel tab or not logged in
        setExcelData(null);
      }
    };

    if (activeTab === 'excel' && isLoggedIn) {
      fetchExcelData();
    } else if (activeTab !== 'excel' || !isLoggedIn) { // Clear Excel data if not on Excel tab or not logged in
      clearExcelData();
    }
  }, [activeTab, isLoggedIn]); // Re-fetch if tab changes or login status changes

  // Clears all form-related states (email, password, errors, messages)
  const clearFormStates = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMessage(null);
    setEmailError(false);
    setPasswordError(false);
    // Clear password reset specific states
    setShowPasswordResetRequestForm(false);
    setShowPasswordResetForm(false);
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

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
      return; // Stop form submission if there are errors
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
        setActiveTab('excel'); // Go to excel after login
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
      return; // Stop form submission if there are errors
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

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Password reset code sent to your email.');
        setShowPasswordResetRequestForm(false);
        setShowPasswordResetForm(true); // Automatically show the reset password form
      } else {
        setError(data.message || 'Failed to send password reset code.');
      }
    } catch (err) {
      console.error('Network error during password reset request:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Password has been reset successfully. You can now log in.');
        clearFormStates();
        setShowPasswordResetForm(false);
        setShowRegisterForm(false); // Go back to login form
      } else {
        setError(data.message || 'Failed to reset password. Please check your code and try again.');
      }
    } catch (err) {
      console.error('Network error during password reset:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (sessionIdToClear?: string) => {
    setIsLoading(true); // Start loading for logout
    setError(null);
    setSuccessMessage(null);
    const currentSessionId = sessionIdToClear || localStorage.getItem('sessionId');

    if (!currentSessionId) {
      console.log('No session to clear on server. Clearing local state only.');
      clearSession();
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Logged out successfully!');
        clearSession(); // Clear local session data
        setActiveTab('excel'); // Redirect to excel
      } else {
        setError(data.message || 'Logout failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error during logout:', err);
      setError('A network error occurred during logout. Please try again.');
    } finally {
      setIsLoading(false); // End global loading
    }
  };

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

  const handleUploadExcel = async () => {
    if (!excelFile) {
      setUploadError('Please select an Excel file to upload.');
      return;
    }

    setIsUploading(true); // Start specific upload loading
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
    reader.readAsDataURL(excelFile); // Read the file as a Data URL for preview if needed later

    reader.onload = async () => {
      try {
        const response = await fetch('/api/upload-excel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}` // Send sessionId via Authorization header
          },
          body: formData,
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

  // Function to clear Excel data
  const clearExcelData = () => {
    setExcelData(null);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="button-spinner"></div>
        </div>
      )}

      {isLoggedIn ? (
        // Main container for the entire application, spaced from edges and rounded
        <div className="flex h-screen w-screen overflow-hidden">
          <div className="flex flex-1 overflow-hidden glassmorphism-dashboard-container"> {/* Apply glassmorphism to the entire dashboard area, with no padding on this container */}
            {/* Left Sidebar / Mobile Bottom Bar */}
            <aside className="flex flex-row w-full h-auto fixed bottom-0 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800/50 custom-scrollbar glassmorphism glass-shimmer-on-hover flex-grow-0 flex-shrink-0 justify-center items-center gap-x-4 z-50 rounded-none border-t border-gray-700/50
               lg:flex-col lg:h-screen lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:px-4 lg:py-6 lg:items-start lg:justify-start lg:gap-y-2 lg:w-fit lg:max-w-[95vw] lg:border-r-4 lg:border-gray-700/50">

              {/* Navigation Links - Desktop */}
              <nav className="hidden lg:block w-full">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('excel')}
                      className={`flex items-center w-16 h-16 p-1 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center rounded-lg`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogout()}
                      className="flex items-center w-16 h-16 p-1 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </li>
                </ul>
              </nav>

              {/* Mobile Navigation - Only Excel and Logout visible for mobile, positioned at the bottom */}
              <nav className="flex lg:hidden w-full justify-between items-center">
                <button
                  onClick={() => handleLogout()}
                  className="flex flex-col items-center w-24 h-24 p-1 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('excel')}
                  className={`flex flex-col items-center w-24 h-24 p-1 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center rounded-lg`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </nav>

            </aside>

            {/* Main Content Area (right side) */}
            <main className="flex-1 p-8 overflow-y-auto custom-scrollbar lg:pl-16 relative"> {/* Added relative for Connect button positioning */}
              {/* Conditional rendering for content based on activeTab */}
              {activeTab === 'excel' && (
                <div className="w-full max-w-4xl text-gray-100 lg:pl-8">
                  <h2 className="text-4xl font-bold mb-6 text-left">Connect to an App</h2>
                  {/* New source selection UI */}
                  <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      {/* Excel */}
                      <div
                        onClick={() => {
                          setSelectedSource('excel');
                          setShowExcelUploadInterface(true); // Show upload interface on click
                        }}
                        className={`relative flex flex-col items-center justify-center w-80 h-80 glassmorphism rounded-xl cursor-pointer transition-all border-2 ${selectedSource === 'excel' ? 'border-white !border-r-white' : 'border-transparent'} hover:border-white p-6`}
                      >
                        {/* Conditional content based on showExcelUploadInterface */}
                        {selectedSource === 'excel' && showExcelUploadInterface ? (
                          <div
                            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-center text-gray-400"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()} // Trigger hidden file input on click
                          >
                            {excelFile ? (
                              <>
                                <p className="text-white mb-2">File selected: <span className="font-bold">{excelFile.name}</span></p>
                                <div className="flex gap-4 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent re-triggering file input
                                      handleUploadExcel();
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg animated-button"
                                  >
                                    {isUploading ? <div className="button-spinner"></div> : 'Upload File'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent re-triggering file input
                                      setExcelFile(null);
                                      setUploadError('');
                                      setUploadSuccess(null);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-600 hover:bg-gray-700 transition-colors shadow-lg"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p>Click to search for file or drag and drop XLSX file here</p>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".xlsx, .xls"
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <>
                            {/* Excel SVG (existing) */}
                            <svg className="h-16 w-16 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="#217346" strokeWidth="2" />
                              <path d="M8 8l4 4-4 4" stroke="#217346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <text x="12" y="16" textAnchor="middle" fontSize="8" fill="#217346" fontWeight="bold">XLSX</text>
                            </svg>
                            <span className="mt-4 text-xl font-semibold">Excel File</span>
                            <p className="text-gray-300 text-sm mt-2 text-center px-4">Upload your Excel files to analyze and visualize your data.</p>
                            {selectedSource === 'excel' && !showExcelUploadInterface && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent re-triggering outer div click
                                  setShowExcelUploadInterface(true);
                                }}
                                className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg animated-button`}
                              >
                                Upload
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {excelData && (
                    <div className="mt-8 p-6 glassmorphism rounded-xl text-gray-100">
                      <h3 className="text-2xl font-bold mb-4">Overview Data</h3>

                      {/* Time Intervals (Headers) */}
                      {excelData.frequency_interval && excelData.frequency_interval.length > 0 && (
                        <div className="flex items-center space-x-4 mb-4 text-gray-300">
                          <span className="font-semibold w-36 text-right">Intervals:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.frequency_interval.map((interval, index) => (
                              <span key={index} className="font-medium">{interval}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Income Section */}
                      <h4 className="text-xl font-bold mt-6 mb-3">Income</h4>
                      {excelData.income_source_1 && excelData.income_source_1_values && (
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="font-semibold w-36 text-right">{excelData.income_source_1}:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.income_source_1_values.map((value, index) => (
                              <span key={index}>{value !== null ? value.toFixed(2) : '-'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {excelData.income_source_2 && excelData.income_source_2_values && (
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="font-semibold w-36 text-right">{excelData.income_source_2}:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.income_source_2_values.map((value, index) => (
                              <span key={index}>{value !== null ? value.toFixed(2) : '-'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {excelData.income_total_label && excelData.income_totals && (
                        <div className="flex items-center space-x-4 font-bold mt-4 border-t border-gray-700 pt-2">
                          <span className="font-semibold w-36 text-right">{excelData.income_total_label}:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.income_totals.map((value, index) => (
                              <span key={index}>{value !== null ? value.toFixed(2) : '-'}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expense Section */}
                      <h4 className="text-xl font-bold mt-6 mb-3">Expenses</h4>
                      {excelData.expense_categories && excelData.expense_values && (
                        <div>
                          {excelData.expense_categories.map((category, rowIndex) => (
                            <div key={rowIndex} className="flex items-center space-x-4 mb-2">
                              <span className="font-semibold w-36 text-right">{category}:</span>
                              <div className="flex flex-wrap gap-x-4">
                                {excelData.expense_values[rowIndex] && excelData.expense_values[rowIndex].map((value, colIndex) => (
                                  <span key={colIndex}>{value !== null ? value.toFixed(2) : '-'}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {excelData.expense_total_label && excelData.expense_totals && (
                        <div className="flex items-center space-x-4 font-bold mt-4 border-t border-gray-700 pt-2">
                          <span className="font-semibold w-36 text-right">{excelData.expense_total_label}:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.expense_totals.map((value, index) => (
                              <span key={index}>{value !== null ? value.toFixed(2) : '-'}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Profit/Loss Section */}
                      <h4 className="text-xl font-bold mt-6 mb-3">Profit/Loss</h4>
                      {excelData.profit_loss_label && excelData.profit_loss_values && (
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="font-semibold w-36 text-right">{excelData.profit_loss_label}:</span>
                          <div className="flex flex-wrap gap-x-4">
                            {excelData.profit_loss_values.map((value, index) => (
                              <span key={index}>{value !== null ? value.toFixed(2) : '-'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen w-full p-4 sm:p-8 overflow-hidden">
          <div className="w-full max-w-md p-8 space-y-8 rounded-2xl glassmorphism">
            {/* Lock Icon */}
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-center">
              <h1 key={showRegisterForm ? "register-title" : (showPasswordResetRequestForm ? "request-reset-title" : (showPasswordResetForm ? "reset-password-title" : "login-title"))}
                  className={`text-3xl font-bold text-fade-in-out text-gray-100`}>
                {showPasswordResetRequestForm
                  ? 'Request Password Reset'
                  : showPasswordResetForm
                  ? 'Reset Your Password'
                  : showRegisterForm
                  ? 'Create Account'
                  : 'Jump In'}
              </h1>
              <p key={showRegisterForm ? "register-subtitle" : (showPasswordResetRequestForm ? "request-reset-subtitle" : (showPasswordResetForm ? "reset-password-subtitle" : "login-subtitle"))}
                 className={`text-gray-400 mt-2 text-fade-in-out`}>
                {showPasswordResetRequestForm
                  ? 'Enter your email to receive a reset code.'
                  : showPasswordResetForm
                  ? 'Enter the code and your new password.'
                  : showRegisterForm
                  ? 'Sign up to get started.'
                  : 'Sign in to continue to your account.'}
              </p>
            </div>

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

            {/* Conditional Forms */}
            {showPasswordResetRequestForm ? (
              // Password Reset Request Form
              <form className="space-y-6" onSubmit={handleRequestPasswordReset} noValidate>
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
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${emailError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Email Address"
                    required
                    onFocus={() => setEmailError(false)}
                    disabled={isLoading}
                  />
                </div>
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="button-spinner"></div> : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : showPasswordResetForm ? (
              // Password Reset Form
              <form className="space-y-6" onSubmit={handlePasswordReset} noValidate>
                {/* Email Input (hidden or read-only) */}
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
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${emailError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Email Address"
                    required
                    onFocus={() => setEmailError(false)}
                    disabled={isLoading || true} // Make it effectively read-only during reset
                  />
                </div>
                {/* Reset Code Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                    placeholder="6-digit Reset Code (valid for 10 min)"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* New Password Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${passwordError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="New Password"
                    required
                    onFocus={() => setPasswordError(false)}
                    disabled={isLoading}
                  />
                </div>
                {/* Confirm New Password Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${passwordError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Confirm New Password"
                    required
                    onFocus={() => setPasswordError(false)}
                    disabled={isLoading}
                  />
                </div>
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="button-spinner"></div> : 'Reset Password'}
                  </button>
                </div>
              </form>
            ) : (
              // Login/Register Form (original logic)
              <form className="space-y-6" onSubmit={showRegisterForm ? handleRegister : handleLogin} noValidate>
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
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${emailError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Email Address"
                    required
                    onFocus={() => setEmailError(false)}
                    disabled={isLoading}
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
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${passwordError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Password"
                    required
                    onFocus={() => setPasswordError(false)}
                    disabled={isLoading}
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
                      <a href="#" className="font-medium text-gray-400 hover:text-gray-200"
                         onClick={(e) => { 
                           e.preventDefault(); 
                           setEmail('');
                           setPassword('');
                           setError(null);
                           setSuccessMessage(null);
                           setShowPasswordResetRequestForm(true); 
                           setShowRegisterForm(false);
                           setShowPasswordResetForm(false);
                         }}>
                        Forgot your password?
                      </a>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="button-spinner"></div> : (showRegisterForm ? 'Register Account' : 'Sign In')}
                  </button>
                </div>
              </form>
            )}

            {/* Toggle Register/Login/Password Reset Links */}
            <div className="text-center mt-4">
              {showPasswordResetRequestForm || showPasswordResetForm ? (
                <p className="text-gray-400 text-sm">
                  Remember your password?{' '}
                  <button
                    onClick={() => {
                      setShowPasswordResetRequestForm(false);
                      setShowPasswordResetForm(false);
                      setShowRegisterForm(false);
                      clearFormStates();
                    }}
                    className="font-medium text-gray-400 hover:text-gray-200 underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : showRegisterForm ? (
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
                    Register
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}