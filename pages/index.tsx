import { useState } from 'react';

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [basiqUserId, setBasiqUserId] = useState<string | null>(null);
  const [bankData, setBankData] = useState<any>(null);
  const [isLoadingBankData, setIsLoadingBankData] = useState(false);

  // Complete Basiq integration flow
  const startBasiqFlow = async () => {
    console.log('🚀 Starting Basiq integration flow...');
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Create Basiq user
      console.log('👤 Step 1: Creating Basiq user...');
      const createUserResponse = await fetch('/api/basiq-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          mobile: '+61400000000'
        })
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(`Failed to create user: ${errorData.message}`);
      }

      const userData = await createUserResponse.json();
      console.log('✅ Step 1 Complete: User created with ID:', userData.basiqUserId);
      setBasiqUserId(userData.basiqUserId);

      // Step 2: Generate consent URL
      console.log('🔗 Step 2: Generating consent URL...');
      const consentResponse = await fetch('/api/basiq-consent-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          basiqUserId: userData.basiqUserId
        })
      });

      if (!consentResponse.ok) {
        const errorData = await consentResponse.json();
        throw new Error(`Failed to generate consent URL: ${errorData.message}`);
      }

      const consentData = await consentResponse.json();
      console.log('✅ Step 2 Complete: Consent URL generated');

      // Step 3: Redirect to Basiq Consent UI
      console.log('🔄 Step 3: Redirecting to Basiq Consent UI...');
      setSuccessMessage('✅ Redirecting to Basiq Consent UI...');

      // Open consent URL in new window/tab
      window.open(consentData.consentUrl, '_blank');

      setSuccessMessage('✅ Consent UI opened! Complete the bank connection in the new tab, then come back here.');

    } catch (err) {
      console.error('❌ Basiq flow failed:', err);
      setError('❌ Basiq flow failed: ' + (err as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Test function to fetch transactions (after consent is complete)
  const testFetchTransactions = async () => {
    if (!basiqUserId) {
      setError('❌ No Basiq User ID. Please complete the consent flow first.');
      return;
    }

    console.log('📊 Testing transaction fetch...');
    setIsLoadingBankData(true);
    setError(null);

    try {
      // Get SERVER_ACCESS token first
      const authResponse = await fetch('/api/basiq-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scope: 'SERVER_ACCESS' })
      });

      if (!authResponse.ok) {
        throw new Error('Failed to get auth token');
      }

      const authData = await authResponse.json();

      // Test the basiq-transactions endpoint
      const response = await fetch(`/api/basiq-transactions?basiqUserId=${basiqUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      });

      console.log('📊 Transaction API Response status:', response.status);
      const data = await response.json();
      console.log('📊 Transaction API Response:', data);

      if (response.ok) {
        setSuccessMessage('✅ Transactions fetched successfully!');
        setBankData(data);
      } else {
        setError(`❌ Transaction fetch failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Transaction test failed:', err);
      setError('❌ Transaction test failed: ' + (err as Error).message);
    } finally {
      setIsLoadingBankData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700/50">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-8">
          🚀 Next.js App Ready!
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-center text-gray-300 mb-6">
            Complete Basiq Integration with Consent Flow
          </p>

          {/* Step 1: Start Basiq Flow */}
          <button
            onClick={startBasiqFlow}
            disabled={isConnecting}
            className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900 ${
              isConnecting
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isConnecting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting Basiq Flow...
              </div>
            ) : (
              '🚀 Start Basiq Consent Flow'
            )}
          </button>

          {/* Step 2: Test Transactions (after consent) */}
          {basiqUserId && (
            <button
              onClick={testFetchTransactions}
              disabled={isLoadingBankData}
              className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 ${
                isLoadingBankData
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoadingBankData ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fetching Transactions...
                </div>
              ) : (
                '📊 Test Fetch Transactions'
              )}
            </button>
          )}

          <div className="text-center text-gray-400 text-sm space-y-1">
            <p>✅ Next.js server running on port 3000</p>
            <p>✅ API routes available at /api/*</p>
            <p>✅ Basiq consent flow ready!</p>
            {basiqUserId && (
              <p className="text-green-400">✅ Basiq User ID: {basiqUserId.substring(0, 8)}...</p>
            )}
          </div>

          {/* Display bank data if available */}
          {bankData && (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Bank Data:</h3>
              <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                {JSON.stringify(bankData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
