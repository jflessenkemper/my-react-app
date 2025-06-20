import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'; // This now contains all your custom styles and animations
import AuthPage from './pages/AuthPage';
import ExcelPage from './pages/ExcelPage';
import DesignPage from './pages/DesignPage';

// Define a type for your Excel data row for better type safety
interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      navigate('/'); // Navigate to login page after logout
    }
  };

<<<<<<< HEAD
=======
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
          <aside className="flex flex-row w-fit max-w-[95vw] h-auto fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800/50 custom-scrollbar glassmorphism glass-shimmer-on-hover flex-grow-0 flex-shrink-0 justify-center items-center gap-x-4 z-50 rounded-none
             lg:flex-col lg:h-screen lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:px-4 lg:py-6 lg:items-start lg:justify-start lg:gap-y-2 lg:border-r-4 lg:border-gray-700/50">

            {/* Navigation Links - Desktop */}
            <nav className="hidden lg:block w-full">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('excel')}
                    className={`flex items-center w-24 h-24 p-2 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center border border-gray-700/50 rounded-lg`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM19 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM5 12h.01M12 12h.01M19 12h.01" />
                    </svg>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLogout()}
                    className="flex items-center w-24 h-24 p-2 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center border border-gray-700/50 rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Mobile Navigation - Only Excel and Logout visible for mobile, positioned at the bottom */}
            <nav className="flex lg:hidden w-full justify-around items-center space-x-4">
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex flex-col items-center w-36 h-36 p-2 transition-colors ${activeTab === 'excel' ? 'bg-blue-600/50 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'} justify-center items-center border border-gray-700/50 rounded-lg`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM19 17v-4m0 0V7m0 6a2 2 0 100 4 2 2 0 000-4zM5 12h.01M12 12h.01M19 12h.01" />
                </svg>
              </button>
              <button
                onClick={() => handleLogout()}
                className="flex flex-col items-center w-36 h-36 p-2 transition-colors text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 justify-center items-center border border-gray-700/50 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </nav>

          </aside>

          {/* Main Content Area (right side) */}
          <main className="flex-1 p-8 overflow-y-auto custom-scrollbar lg:pl-64"> {/* Added padding and lg:pl-64 for sidebar offset */}
            {/* Conditional rendering for content based on activeTab */}
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
>>>>>>> bcb3f77 (Fixed the buttons)
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-700">
        <nav className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 text-white shadow-md z-20">
          <ul className="flex justify-center space-x-6">
            <li>
              <Link to="/" className="hover:text-blue-400 transition-colors duration-200">Login</Link>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <Link to="/excel" className="hover:text-blue-400 transition-colors duration-200">Excel</Link>
                </li>
                <li>
                  <button onClick={() => handleLogout()} className="hover:text-blue-400 transition-colors duration-200 bg-transparent border-none cursor-pointer text-white p-0">
                    Logout
                  </button>
                </li>
              </>
            )}
            <li>
              <Link to="/design" className="hover:text-blue-400 transition-colors duration-200">Design Reference</Link>
            </li>
          </ul>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <AuthPage
                setIsLoggedIn={setIsLoggedIn}
                setLoggedInUserEmail={setLoggedInUserEmail}
                setActiveTab={(tab) => navigate(`/${tab}`)}
              />
            } />
            <Route
              path="/excel"
              element={
                isLoggedIn ? (
                  <ExcelPage
                    isLoggedIn={isLoggedIn}
                    loggedInUserEmail={loggedInUserEmail}
                    handleLogout={handleLogout}
                  />
                ) : (
                  <AuthPage
                    setIsLoggedIn={setIsLoggedIn}
                    setLoggedInUserEmail={setLoggedInUserEmail}
                    setActiveTab={(tab) => navigate(`/${tab}`)}
                  />
                )
              }
            />
            <Route path="/design" element={<DesignPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}