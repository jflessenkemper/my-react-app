// api/basiq-transactions.js

export default async function handler(req, res) {
  console.log('📊 [BASIQ-TRANSACTIONS] Request received');
  console.log('📊 [BASIQ-TRANSACTIONS] Method:', req.method);
  console.log('📊 [BASIQ-TRANSACTIONS] Query:', req.query);
  console.log('📊 [BASIQ-TRANSACTIONS] Headers:', req.headers);

  if (req.method !== 'GET') {
    console.log('❌ [BASIQ-TRANSACTIONS] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { basiqUserId } = req.query;
  const authHeader = req.headers.authorization;

  console.log('📊 [BASIQ-TRANSACTIONS] Basiq user ID:', basiqUserId);
  console.log('📊 [BASIQ-TRANSACTIONS] Auth header present:', authHeader ? 'Yes' : 'No');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [BASIQ-TRANSACTIONS] Missing or invalid authorization header');
    return res.status(401).json({ message: 'Authorization token required' });
  }

  if (!basiqUserId) {
    console.log('❌ [BASIQ-TRANSACTIONS] Missing Basiq user ID');
    return res.status(400).json({ message: 'Basiq user ID is required' });
  }

  const accessToken = authHeader.split(' ')[1];
  console.log('📊 [BASIQ-TRANSACTIONS] Access token present:', accessToken ? 'Yes' : 'No');

  try {
    // Get user's accounts
    console.log('💳 [BASIQ-TRANSACTIONS] Fetching accounts...');
    const accountsResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    console.log('💳 [BASIQ-TRANSACTIONS] Accounts response status:', accountsResponse.status);
    console.log('💳 [BASIQ-TRANSACTIONS] Accounts response ok:', accountsResponse.ok);

    if (!accountsResponse.ok) {
      const errorData = await accountsResponse.text();
      console.error('❌ [BASIQ-TRANSACTIONS] Basiq accounts error:', errorData);
      console.error('❌ [BASIQ-TRANSACTIONS] Response headers:', Object.fromEntries(accountsResponse.headers.entries()));
      return res.status(accountsResponse.status).json({
        message: 'Failed to fetch accounts from Basiq',
        details: errorData
      });
    }

    const accountsData = await accountsResponse.json();
    console.log('✅ [BASIQ-TRANSACTIONS] Accounts fetched:', accountsData);

    // Get user's transactions
    const transactionsResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/transactions?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.text();
      console.error('Basiq transactions error:', errorData);
      return res.status(transactionsResponse.status).json({ 
        message: 'Failed to fetch transactions from Basiq' 
      });
    }

    const transactionsData = await transactionsResponse.json();

    // Get user's connections
    const connectionsResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/connections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    let connectionsData = { data: [] };
    if (connectionsResponse.ok) {
      connectionsData = await connectionsResponse.json();
    }

    res.status(200).json({
      accounts: accountsData.data || [],
      transactions: transactionsData.data || [],
      connections: connectionsData.data || [],
      summary: {
        totalAccounts: accountsData.data?.length || 0,
        totalTransactions: transactionsData.data?.length || 0,
        totalConnections: connectionsData.data?.length || 0
      }
    });

  } catch (error) {
    console.error('Basiq data fetch error:', error);
    res.status(500).json({ 
      message: 'An internal server error occurred while fetching bank data.' 
    });
  }
}
