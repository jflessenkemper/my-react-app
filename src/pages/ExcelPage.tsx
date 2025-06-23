import React, { useState, useEffect, useRef } from 'react';

interface ExcelRow {
  [key: string]: any; // A row can have any string key with any value
}

interface ExcelPageProps {
  isLoggedIn: boolean;
  loggedInUserEmail: string | null;
  handleLogout: () => Promise<void>;
}

export default function ExcelPage({ isLoggedIn, loggedInUserEmail, handleLogout }: ExcelPageProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearExcelData = () => {
    setExcelData(null);
    setExcelFile(null);
    setUploadError('');
    setUploadSuccess(null);
  };

  useEffect(() => {
    const fetchExcelData = async () => {
      if (isLoggedIn) {
        setUploadError('');
        setUploadSuccess('');
        setIsLoading(true);
        const sessionId = localStorage.getItem('sessionId');

        if (!sessionId) {
          setUploadError('Session not found. Please log in again.');
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch('/api/get-excel-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionId}`
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
        clearExcelData();
      }
    };

    if (isLoggedIn) {
      fetchExcelData();
    } else if (!isLoggedIn) {
      clearExcelData();
    }
  }, [isLoggedIn]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setExcelFile(event.target.files[0]);
      setUploadError(''); // Clear any previous errors when a new file is selected
      setUploadSuccess(null);
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

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(null);
    const sessionId = localStorage.getItem('sessionId');

    if (!sessionId) {
      setUploadError('Session not found. Please log in again.');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('excel', excelFile);
    formData.append('sessionId', sessionId);

    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        // No Content-Type header needed for FormData; browser sets it automatically
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(data.message || 'Excel file uploaded successfully!');
        setExcelFile(null); // Clear the selected file after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input field
        }
        // Optionally re-fetch excel data to show updated content
        // fetchExcelData(); // This would cause a re-render and re-fetch
      } else {
        setUploadError(data.message || 'Excel upload failed.');
      }
    } catch (err) {
      console.error('Network error during Excel upload:', err);
      setUploadError('Network error during Excel upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 p-4 sm:p-6 lg:p-8 text-white">
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 w-full max-w-4xl border border-white/20 relative z-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white drop-shadow-lg">Excel Operations</h1>

        <div className="mb-8 text-center">
          <p className="text-lg mb-2">Welcome, {loggedInUserEmail}!</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 glass-button"
          >
            Logout
          </button>
        </div>

        {/* Excel Upload Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Upload Excel File</h2>
          <div
            className="border-2 border-dashed border-white/40 rounded-lg p-6 text-center cursor-pointer hover:border-white/60 transition duration-300 ease-in-out mb-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            {excelFile ? (
              <p className="text-lg text-green-300">Selected file: {excelFile.name}</p>
            ) : (
              <p className="text-lg text-gray-300">Drag & drop an Excel file here, or click to select</p>
            )}
            <p className="text-sm text-gray-400 mt-1">(Max file size: 10MB)</p>
          </div>
          {uploadError && <p className="text-red-300 text-center mb-4">{uploadError}</p>}
          {uploadSuccess && <p className="text-green-300 text-center mb-4">{uploadSuccess}</p>}
          <button
            onClick={handleUploadExcel}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 glass-button"
            disabled={!excelFile || isUploading}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full border-white border-r-transparent mr-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Uploading...
              </div>
            ) : (
              'Upload Excel'
            )}
          </button>
        </section>

        {/* Excel Data Display Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Fetched Excel Data</h2>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-12 w-12"></div>
            </div>
          ) : excelData && excelData.length > 0 ? (
            <div className="overflow-x-auto bg-white/5 rounded-lg border border-white/20 p-4">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/10">
                  <tr>
                    {Object.keys(excelData[0]).map((key) => (
                      <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {excelData.map((row, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      {Object.values(row).map((value, idx) => (
                        <td key={idx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No Excel data available. Upload a file or ensure you are logged in.</p>
          )}
        </section>
      </div>
    </div>
  );
} 