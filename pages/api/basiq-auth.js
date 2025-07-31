// api/basiq-auth.js

export default async function handler(req, res) {
  console.log('🔐 [BASIQ-AUTH] Request received');
  console.log('🔐 [BASIQ-AUTH] Method:', req.method);
  console.log('🔐 [BASIQ-AUTH] Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ [BASIQ-AUTH] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get scope and userId from request body
    const { scope = 'SERVER_ACCESS', userId } = req.body;
    console.log('🔐 [BASIQ-AUTH] Requested scope:', scope);
    console.log('🔐 [BASIQ-AUTH] User ID:', userId);

    // Basiq API credentials
    const basiqApiKey = 'NWE2ZTdkNTktMGUzNC00ZjgzLWJkZTUtMTUwNWE0MzViNDY1Ojc5Y2ExOGM3LTA0ZjgtNDk3Yi05ZTMwLTk2Mzg3ZDgzNmMwNQ==';
    console.log('🔐 [BASIQ-AUTH] API key present:', basiqApiKey ? 'Yes' : 'No');

    // Prepare request body based on scope
    let requestBody = `scope=${scope}`;
    if (scope === 'CLIENT_ACCESS' && userId) {
      requestBody += `&userId=${userId}`;
      console.log('🔐 [BASIQ-AUTH] Creating CLIENT_ACCESS token bound to user:', userId);
    }

    // Get Basiq auth token
    console.log('🔐 [BASIQ-AUTH] Making request to Basiq token endpoint...');
    const authResponse = await fetch('https://au-api.basiq.io/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basiqApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0'
      },
      body: requestBody
    });

    console.log('🔐 [BASIQ-AUTH] Basiq response status:', authResponse.status);
    console.log('🔐 [BASIQ-AUTH] Basiq response ok:', authResponse.ok);

    if (!authResponse.ok) {
      const errorData = await authResponse.text();
      console.error('❌ [BASIQ-AUTH] Basiq auth error:', errorData);
      console.error('❌ [BASIQ-AUTH] Response headers:', Object.fromEntries(authResponse.headers.entries()));
      return res.status(authResponse.status).json({
        message: 'Failed to authenticate with Basiq API',
        details: errorData
      });
    }

    const authData = await authResponse.json();
    console.log('✅ [BASIQ-AUTH] Auth successful');
    console.log('✅ [BASIQ-AUTH] Token type:', authData.token_type);
    console.log('✅ [BASIQ-AUTH] Expires in:', authData.expires_in);
    console.log('✅ [BASIQ-AUTH] Access token present:', authData.access_token ? 'Yes' : 'No');

    res.status(200).json({
      access_token: authData.access_token,
      token_type: authData.token_type,
      expires_in: authData.expires_in
    });

  } catch (error) {
    console.error('❌ [BASIQ-AUTH] Exception:', error);
    console.error('❌ [BASIQ-AUTH] Error stack:', error.stack);
    res.status(500).json({
      message: 'An internal server error occurred during Basiq authentication.',
      error: error.message
    });
  }
}
