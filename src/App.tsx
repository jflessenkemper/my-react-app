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
  const [isSignInLoading, setIsSignInLoading] = useState(false); // Loading state for sign-in button
  const [isLogoutLoading, setIsLogoutLoading] = useState(false); // Loading state for logout button
  const [isBankBoxSelected, setIsBankBoxSelected] = useState(false); // State for bank connection box selection
  const [isConnecting, setIsConnecting] = useState(false); // State for bank connection loading
  const [basiqUserId, setBasiqUserId] = useState<string | null>(null); // Store Basiq user ID
  const [bankData, setBankData] = useState<any>(null); // Store bank account and transaction data
  const [isLoadingBankData, setIsLoadingBankData] = useState(false); // Loading state for bank data
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
        // Remove global loading for Excel data fetching
        const sessionId = localStorage.getItem('sessionId');

        if (!sessionId) {
          setError('Session not found. Please log in again.');
          // Remove global loading state
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
          // Remove global loading state
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

    setIsSignInLoading(true);
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
      setIsSignInLoading(false); // End sign-in loading
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

    setIsSignInLoading(true);
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
      setIsSignInLoading(false); // End sign-in loading
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignInLoading(true);
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
      setIsSignInLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSignInLoading(true);
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
      setIsSignInLoading(false);
    }
  };

  const handleLogout = async (sessionIdToClear?: string) => {
    setIsLogoutLoading(true); // Start loading for logout
    setError(null);
    setSuccessMessage(null);
    const currentSessionId = sessionIdToClear || localStorage.getItem('sessionId');

    if (!currentSessionId) {
      console.log('No session to clear on server. Clearing local state only.');
      clearSession();
      setIsLogoutLoading(false);
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
      setIsLogoutLoading(false); // End logout loading
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

  // Function to fetch bank data from Basiq
  const fetchBankData = async (userId: string, accessToken: string) => {
    console.log('🔄 Starting fetchBankData...');
    console.log('📋 Parameters:', { userId, accessToken: accessToken ? 'Present' : 'Missing' });

    setIsLoadingBankData(true);
    try {
      console.log('🌐 Making request to /api/basiq-transactions...');
      const response = await fetch(`/api/basiq-transactions?basiqUserId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        console.log('✅ Response OK, parsing JSON...');
        const data = await response.json();
        console.log('📊 Bank data received:', data);
        setBankData(data);
        setSuccessMessage('Bank data loaded successfully!');
        console.log('✅ Bank data set successfully');
      } else {
        console.error('❌ Response not OK');
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setError(`Failed to fetch bank data: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching bank data:', err);
      const error = err as Error;
      setError(`Network error while fetching bank data: ${error.message}`);
    } finally {
      setIsLoadingBankData(false);
      console.log('🏁 fetchBankData completed');
    }
  };

  // Function to handle bank connection via Basiq API
  const handleBankConnection = async () => {
    console.log('🚀 Starting bank connection process...');
    console.log('👤 Logged in user email:', loggedInUserEmail);
    console.log('🔑 Session ID:', localStorage.getItem('sessionId'));

    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Get Basiq auth token
      console.log('🔐 Step 1: Getting Basiq auth token...');
      const authResponse = await fetch('/api/basiq-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('🔐 Auth response status:', authResponse.status);
      console.log('🔐 Auth response ok:', authResponse.ok);

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('❌ Auth failed:', errorText);
        throw new Error(`Failed to authenticate with Basiq: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      console.log('✅ Auth successful, token received:', authData.access_token ? 'Present' : 'Missing');

      // Step 2: Create Basiq user and auth link
      console.log('👤 Step 2: Creating Basiq user and connection...');
      const connectionResponse = await fetch('/api/basiq-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.access_token}`
        },
        body: JSON.stringify({
          userEmail: loggedInUserEmail,
          sessionId: localStorage.getItem('sessionId')
        }),
      });

      console.log('👤 Connection response status:', connectionResponse.status);
      console.log('👤 Connection response ok:', connectionResponse.ok);

      if (!connectionResponse.ok) {
        const errorText = await connectionResponse.text();
        console.error('❌ Connection failed:', errorText);
        throw new Error(`Failed to create bank connection: ${connectionResponse.status}`);
      }

      const connectionData = await connectionResponse.json();
      console.log('✅ Connection successful:', connectionData);

      // Store the Basiq user ID for later use
      setBasiqUserId(connectionData.basiqUserId);
      console.log('💾 Stored Basiq user ID:', connectionData.basiqUserId);

      // Step 3: For demo purposes, simulate connection with Hooli test bank
      console.log('🏦 Step 3: Connecting to Hooli test bank...');
      setSuccessMessage('Connecting to Hooli test bank...');

      // Wait a moment then fetch demo data
      console.log('⏳ Waiting 2 seconds before fetching data...');
      setTimeout(async () => {
        console.log('📊 Now fetching bank data...');
        await fetchBankData(connectionData.basiqUserId, authData.access_token);
      }, 2000);

    } catch (err) {
      console.error('❌ Bank connection error:', err);
      const error = err as Error;
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      setError(`Failed to connect to bank: ${error.message}`);
    } finally {
      console.log('🏁 Bank connection process completed');
      setIsConnecting(false);
    }
  };

  return (
    <>
      {isLoggedIn ? (
        // Main container for the entire application, spaced from edges and rounded
        <div className="flex h-screen w-screen overflow-hidden">
          <div className="flex flex-1 overflow-hidden glassmorphism-dashboard-container"> {/* Apply glassmorphism to the entire dashboard area, with no padding on this container */}
            {/* Left Sidebar / Mobile Bottom Bar */}
            <aside className="flex flex-row w-full h-auto fixed bottom-0 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800/50 custom-scrollbar glassmorphism flex-grow-0 flex-shrink-0 justify-center items-center gap-x-4 z-50 rounded-none border-t border-gray-700/50
               lg:flex-col lg:h-screen lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:px-4 lg:py-6 lg:items-start lg:justify-start lg:gap-y-2 lg:w-fit lg:max-w-[95vw] lg:border-r-4 lg:border-gray-700/50">

              {/* Navigation Links - Desktop */}
              <nav className="hidden lg:block w-full">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('excel')}
                      className={`flex items-center w-16 h-16 p-1 ${activeTab === 'excel' ? 'bg-gray-700/50 text-white outline outline-2 outline-gray-400/60' : 'bg-gray-800/50 text-gray-300'} justify-center items-center rounded-lg`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogout()}
                      className={`flex items-center w-16 h-16 p-1 transition-colors justify-center items-center rounded-lg ${
                        isLogoutLoading
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                          : 'text-red-300 bg-red-500/20 hover:bg-red-500/30 active:outline active:outline-2 active:outline-red-300/60'
                      }`}
                      disabled={isLogoutLoading}
                    >
                      {isLogoutLoading ? (
                        <div className="button-spinner"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                    </button>
                  </li>
                </ul>
              </nav>

              {/* Mobile Navigation - Only Excel and Logout visible for mobile, positioned at the bottom */}
              <nav className="flex lg:hidden w-full justify-between items-center">
                <button
                  onClick={() => handleLogout()}
                  className={`flex flex-col items-center w-24 h-24 p-1 transition-colors justify-center items-center rounded-lg ${
                    isLogoutLoading
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'text-red-300 bg-red-500/20 hover:bg-red-500/30 active:outline active:outline-2 active:outline-red-300/60'
                  }`}
                  disabled={isLogoutLoading}
                >
                  {isLogoutLoading ? (
                    <div className="button-spinner"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('excel')}
                  className={`flex flex-col items-center w-24 h-24 p-1 ${activeTab === 'excel' ? 'bg-gray-700/50 text-white outline outline-2 outline-gray-400/60' : 'bg-gray-800/50 text-gray-300'} justify-center items-center rounded-lg`}
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
                  {/* Bank Connection Box */}
                  <div className="flex flex-col gap-6">
                    {!bankData ? (
                      <div
                        onClick={() => setIsBankBoxSelected(!isBankBoxSelected)}
                        className={`relative flex flex-col items-center justify-center w-full h-64 glassmorphism rounded-xl cursor-pointer transition-all border-2 p-8 ${
                          isBankBoxSelected
                            ? 'border-white/60'
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        {/* Bank Icon */}
                        <svg
                          className="h-16 w-16 text-blue-400 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>

                        {/* Text Content */}
                        <h3 className="text-xl font-semibold mb-2 text-center">Connect Securely to a Bank Account</h3>
                        <p className="text-gray-300 text-sm text-center max-w-md">
                          Securely link your bank account to access your financial data and insights.
                        </p>

                        {/* Connect Button - Only shows when box is selected */}
                        {isBankBoxSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the box click
                              handleBankConnection();
                            }}
                            className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                              isConnecting
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'animated-button text-gray-900 hover:text-gray-900'
                            }`}
                            disabled={isConnecting}
                          >
                            {isConnecting ? <div className="button-spinner"></div> : 'Connect'}
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Bank Data Display */
                      <div className="space-y-6">
                        {/* Account Summary */}
                        <div className="glassmorphism rounded-xl p-6">
                          <h3 className="text-2xl font-bold mb-4 text-white">Bank Account Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-500/20 rounded-lg p-4">
                              <h4 className="text-sm text-gray-300">Total Accounts</h4>
                              <p className="text-2xl font-bold text-white">{bankData.summary?.totalAccounts || 0}</p>
                            </div>
                            <div className="bg-green-500/20 rounded-lg p-4">
                              <h4 className="text-sm text-gray-300">Total Transactions</h4>
                              <p className="text-2xl font-bold text-white">{bankData.summary?.totalTransactions || 0}</p>
                            </div>
                            <div className="bg-purple-500/20 rounded-lg p-4">
                              <h4 className="text-sm text-gray-300">Connected Banks</h4>
                              <p className="text-2xl font-bold text-white">{bankData.summary?.totalConnections || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Accounts List */}
                        {bankData.accounts && bankData.accounts.length > 0 && (
                          <div className="glassmorphism rounded-xl p-6">
                            <h4 className="text-xl font-bold mb-4 text-white">Accounts</h4>
                            <div className="space-y-3">
                              {bankData.accounts.slice(0, 5).map((account: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                                  <div>
                                    <p className="font-semibold text-white">{account.name || 'Account'}</p>
                                    <p className="text-sm text-gray-300">{account.accountNo || account.id}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-white">
                                      ${account.balance ? parseFloat(account.balance).toFixed(2) : '0.00'}
                                    </p>
                                    <p className="text-sm text-gray-300">{account.type || 'Unknown'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Transactions */}
                        {bankData.transactions && bankData.transactions.length > 0 && (
                          <div className="glassmorphism rounded-xl p-6">
                            <h4 className="text-xl font-bold mb-4 text-white">Recent Transactions</h4>
                            <div className="space-y-3">
                              {bankData.transactions.slice(0, 10).map((transaction: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                                  <div>
                                    <p className="font-semibold text-white">{transaction.description || 'Transaction'}</p>
                                    <p className="text-sm text-gray-300">
                                      {transaction.postDate ? new Date(transaction.postDate).toLocaleDateString() : 'Unknown date'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold ${parseFloat(transaction.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {parseFloat(transaction.amount) >= 0 ? '+' : ''}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-300">{transaction.class || 'Unknown'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Refresh Button */}
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => basiqUserId && fetchBankData(basiqUserId, '')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                              isLoadingBankData
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'animated-button text-gray-900 hover:text-gray-900'
                            }`}
                            disabled={isLoadingBankData}
                          >
                            {isLoadingBankData ? <div className="button-spinner"></div> : 'Refresh Data'}
                          </button>

                          {/* Debug Button */}
                          <button
                            onClick={() => {
                              console.log('🔍 DEBUG INFO:');
                              console.log('- Logged in user:', loggedInUserEmail);
                              console.log('- Session ID:', localStorage.getItem('sessionId'));
                              console.log('- Basiq User ID:', basiqUserId);
                              console.log('- Bank Data:', bankData);
                              console.log('- Is Connecting:', isConnecting);
                              console.log('- Is Loading Bank Data:', isLoadingBankData);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-600 hover:bg-gray-700 transition-colors"
                          >
                            Debug Info
                          </button>

                          {/* Test API Button */}
                          <button
                            onClick={async () => {
                              console.log('🧪 Testing API endpoints...');
                              try {
                                const response = await fetch('/api/basiq-auth', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' }
                                });
                                console.log('🧪 Auth API response:', response.status, response.ok);
                                if (response.ok) {
                                  const data = await response.json();
                                  console.log('🧪 Auth API data:', data);
                                } else {
                                  const error = await response.text();
                                  console.log('🧪 Auth API error:', error);
                                }
                              } catch (err) {
                                const error = err as Error;
                                console.error('🧪 Auth API exception:', error.message);
                              }
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 transition-colors"
                          >
                            Test API
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                  ? 'Password Reset'
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
                    disabled={isSignInLoading}
                  />
                </div>
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isSignInLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isSignInLoading}
                  >
                    {isSignInLoading ? <div className="button-spinner"></div> : 'Send Reset Code'}
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
                    disabled={isSignInLoading || true} // Make it effectively read-only during reset
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
                    disabled={isSignInLoading}
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
                    disabled={isSignInLoading}
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
                    disabled={isSignInLoading}
                  />
                </div>
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 ${
                      isSignInLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isSignInLoading}
                  >
                    {isSignInLoading ? <div className="button-spinner"></div> : 'Reset Password'}
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
                    disabled={isSignInLoading}
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
                    disabled={isSignInLoading}
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
                      isSignInLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'animated-button text-gray-900 hover:text-gray-900'
                    }`}
                    disabled={isSignInLoading}
                  >
                    {isSignInLoading ? <div className="button-spinner"></div> : (showRegisterForm ? 'Register Account' : 'Sign In')}
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