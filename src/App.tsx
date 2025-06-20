import { useState, useEffect, useRef } from 'react';
import './App.css'; // This now contains all your custom styles and animations

// Define a type for your Excel data row for better type safety
interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'excel'>('dashboard'); // State for active tab

  // States for Excel upload functionality
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Specific loading for Excel upload
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
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
        setActiveTab('dashboard'); // Redirect to dashboard or login
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

  // --- Render Dashboard Layout if Logged In ---
  if (isLoggedIn) {
    return (
      // Main container for the entire application, spaced from edges and rounded
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden glassmorphism-dashboard-container"> {/* Apply glassmorphism to the entire dashboard area, with no padding on this container */}
          {/* Left Sidebar / Mobile Bottom Bar */}
          <aside className="flex flex-row w-fit max-w-[95vw] h-auto fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gray-800/50 custom-scrollbar glassmorphism glass-shimmer-on-hover flex-grow-0 flex-shrink-0 justify-center items-center gap-x-4 z-50
             lg:flex-col lg:w-64 lg:h-screen lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:px-4 lg:py-6 lg:rounded-none lg:items-start lg:justify-start lg:gap-y-2">
            {/* Desktop-only: Mintify Bites Logo & Search - hidden on mobile */}
            <div className="hidden lg:flex items-center justify-between w-full mb-6">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.527 1.037L9.04 10l3.197 6.467a1 1 0 01-.986 1.488l-6-1.5a1 1 0 01-.482-1.258L7.82 9.04l-3.197-6.467a1 1 0 01.986-1.488l6 1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-2xl font-bold text-gray-100">Mintify Bites</span>
              </div>
              {/* Search Icon / Command Palette - Placeholder */}
              <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {/* Desktop-only: Divider */}
            <div className="hidden lg:block w-full h-px bg-gray-700/50 mb-6"></div>

            {/* Navigation Links - Hidden on Mobile, Shown on Desktop */}
            <nav className="hidden lg:block w-full">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'dashboard' ? 'bg-blue-600/50 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {/* Implement Notifications Logic */}}
                    className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17l-3 3m0 0l-3-3m3 3V2m0 16a2 2 0 110 4 2 2 0 010-4z" />
                    </svg>
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {/* Implement Tasks Logic */}}
                    className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Tasks
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {/* Implement Settings Logic */}}
                    className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.334.872 2.799 2.45a1.724 1.724 0 000 2.573c.942 1.543-.872 3.334-2.45 2.799a1.724 1.724 0 00-1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.942 1.543.872 3.334-2.45-2.799a1.724 1.724 0 00-1.066 2.573z" />
                    </svg>
                    Settings
                  </button>
                </li>
                <li className="mt-4"> {/* Spacing for new section */}
                  <span className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Workspace</span>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => {/* Implement Documents Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Documents
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Emails Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Emails
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Projects Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Projects
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Calendar Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h.01M7 12h.01M7 15h.01M17 12h.01M17 15h.01M17 18h.01M3 21h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="mt-4"> {/* Spacing for new section */}
                  <span className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Teamspace</span>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => {/* Implement Project Management Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Project management
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Engineering Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Engineering
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Design Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4z" />
                        </svg>
                        Design
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="mt-4"> {/* Spacing for new section */}
                  <span className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Labels</span>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => {/* Implement Black Friday Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-3"></span> {/* Placeholder color */}
                        Black Friday
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Launch Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-3"></span> {/* Placeholder color */}
                        Launch
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Marketing Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <span className="h-2 w-2 rounded-full bg-purple-500 mr-3"></span> {/* Placeholder color */}
                        Marketing
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {/* Implement Big Campaign Logic */}}
                        className="flex items-center w-full p-2 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                      >
                        <span className="h-2 w-2 rounded-full bg-yellow-500 mr-3"></span> {/* Placeholder color */}
                        Big campaign
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>

            {/* Excel Tab (visible on both mobile and desktop) */}
            <div className="flex-none lg:w-full">
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex items-center justify-center py-2 px-4 rounded-lg transition-colors text-sm ${activeTab === 'excel' ? 'bg-[rgba(0,128,0,0.7)] text-white' : 'bg-[rgba(0,128,0,0.5)] hover:bg-[rgba(0,128,0,0.7)] text-white'} w-auto lg:w-full`}
                title="Excel" // Tooltip for icon-only button
              >
                <span className="text-white font-bold text-lg">E</span>
              </button>
            </div>

            {/* Logout Button in Sidebar - visible on both mobile and desktop */}
            <div className="order-first mr-4 flex-none lg:order-last lg:mt-auto lg:mr-0 lg:w-full lg:pt-0">
              <button
                onClick={() => handleLogout()}
                className="flex items-center justify-center py-2 px-4 rounded-lg bg-red-600/50 hover:bg-red-700/50 text-white transition-colors text-sm w-auto lg:w-full"
                title="Logout" // Tooltip for icon-only button
              >
                <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {/* No "Logout" text here as requested */}
              </button>
            </div>

          </aside>

          {/* Main Content Area (right side) */}
          <main className="flex-1 p-8 overflow-y-auto custom-scrollbar lg:pl-64"> {/* Added padding and lg:pl-64 for sidebar offset */}
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
          {/* Always render content, control via isLoading */}
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

              <form className="space-y-6" onSubmit={showRegisterForm ? handleRegister : handleLogin} noValidate>
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
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-700/50 text-gray-200 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ${emailError ? 'border-red-500/50' : 'border-neutral-700'}`}
                    placeholder="Email Address"
                    required
                    onFocus={() => setEmailError(false)} // Clear error on focus
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
                    onFocus={() => setPasswordError(false)} // Clear error on focus
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
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isLoading
                        ? 'bg-gray-600 cursor-not-allowed' // Greyed out, no animation
                        : 'animated-button text-gray-900 hover:text-gray-900' // Apply gradient, text color matches original
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="button-spinner"></div> : (showRegisterForm ? 'Register Account' : 'Sign In')}
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