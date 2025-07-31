// api/basiq-consent-url.js

export default async function handler(req, res) {
  console.log('🔗 [BASIQ-CONSENT-URL] Request received');
  console.log('🔗 [BASIQ-CONSENT-URL] Method:', req.method);
  console.log('🔗 [BASIQ-CONSENT-URL] Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ [BASIQ-CONSENT-URL] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { basiqUserId } = req.body;

  if (!basiqUserId) {
    console.log('❌ [BASIQ-CONSENT-URL] Missing basiqUserId');
    return res.status(400).json({ message: 'Basiq User ID is required' });
  }

  try {
    // Get a CLIENT_ACCESS token bound to the user
    console.log('🔗 [BASIQ-CONSENT-URL] Getting CLIENT_ACCESS token for user:', basiqUserId);
    const authResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/basiq-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        scope: 'CLIENT_ACCESS',
        userId: basiqUserId 
      })
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('❌ [BASIQ-CONSENT-URL] Auth failed:', authError);
      return res.status(500).json({ message: 'Failed to get CLIENT_ACCESS token' });
    }

    const authData = await authResponse.json();
    console.log('✅ [BASIQ-CONSENT-URL] Got CLIENT_ACCESS token');

    // Generate consent URL
    const consentUrl = `https://consent.basiq.io/home?token=${authData.access_token}`;
    console.log('✅ [BASIQ-CONSENT-URL] Generated consent URL');

    res.status(200).json({
      consentUrl: consentUrl,
      clientToken: authData.access_token,
      basiqUserId: basiqUserId
    });

  } catch (error) {
    console.error('❌ [BASIQ-CONSENT-URL] Exception:', error);
    res.status(500).json({
      message: 'An internal server error occurred during consent URL generation.',
      error: error.message
    });
  }
}
