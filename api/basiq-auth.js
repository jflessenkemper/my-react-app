// api/basiq-auth.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Basiq API credentials
    const basiqApiKey = 'NWE2ZTdkNTktMGUzNC00ZjgzLWJkZTUtMTUwNWE0MzViNDY1Ojc5Y2ExOGM3LTA0ZjgtNDk3Yi05ZTMwLTk2Mzg3ZDgzNmMwNQ==';

    // Get Basiq auth token
    const authResponse = await fetch('https://au-api.basiq.io/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basiqApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0'
      },
      body: 'scope=SERVER_ACCESS'
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.text();
      console.error('Basiq auth error:', errorData);
      return res.status(authResponse.status).json({ 
        message: 'Failed to authenticate with Basiq API' 
      });
    }

    const authData = await authResponse.json();
    
    res.status(200).json({
      access_token: authData.access_token,
      token_type: authData.token_type,
      expires_in: authData.expires_in
    });

  } catch (error) {
    console.error('Basiq authentication error:', error);
    res.status(500).json({ 
      message: 'An internal server error occurred during Basiq authentication.' 
    });
  }
}
