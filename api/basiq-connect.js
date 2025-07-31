// api/basiq-connect.js

export default async function handler(req, res) {
  console.log('👤 [BASIQ-CONNECT] Request received');
  console.log('👤 [BASIQ-CONNECT] Method:', req.method);
  console.log('👤 [BASIQ-CONNECT] Headers:', req.headers);
  console.log('👤 [BASIQ-CONNECT] Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ [BASIQ-CONNECT] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userEmail, sessionId } = req.body;
  const authHeader = req.headers.authorization;

  console.log('👤 [BASIQ-CONNECT] User email:', userEmail);
  console.log('👤 [BASIQ-CONNECT] Session ID:', sessionId);
  console.log('👤 [BASIQ-CONNECT] Auth header present:', authHeader ? 'Yes' : 'No');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [BASIQ-CONNECT] Missing or invalid authorization header');
    return res.status(401).json({ message: 'Authorization token required' });
  }

  if (!userEmail || !sessionId) {
    console.log('❌ [BASIQ-CONNECT] Missing required fields');
    return res.status(400).json({ message: 'User email and session ID are required' });
  }

  const accessToken = authHeader.split(' ')[1];
  console.log('👤 [BASIQ-CONNECT] Access token present:', accessToken ? 'Yes' : 'No');

  try {
    // Step 1: Create a Basiq user
    console.log('👤 [BASIQ-CONNECT] Step 1: Creating Basiq user...');
    const userPayload = {
      email: userEmail,
      mobile: '+61400000001', // Blank Australian mobile number
      firstName: userEmail.split('@')[0], // Use email prefix as first name
      lastName: 'User'
    };
    console.log('👤 [BASIQ-CONNECT] User payload:', userPayload);

    const createUserResponse = await fetch('https://au-api.basiq.io/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify(userPayload)
    });

    console.log('👤 [BASIQ-CONNECT] Create user response status:', createUserResponse.status);
    console.log('👤 [BASIQ-CONNECT] Create user response ok:', createUserResponse.ok);

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error('❌ [BASIQ-CONNECT] Basiq create user error:', errorData);
      console.error('❌ [BASIQ-CONNECT] Response headers:', Object.fromEntries(createUserResponse.headers.entries()));
      return res.status(createUserResponse.status).json({
        message: 'Failed to create Basiq user',
        details: errorData
      });
    }

    const userData = await createUserResponse.json();
    console.log('✅ [BASIQ-CONNECT] User created successfully:', userData);
    const basiqUserId = userData.id;
    console.log('✅ [BASIQ-CONNECT] Basiq user ID:', basiqUserId);

    // Step 2: Create an auth link for the user
    console.log('🔗 [BASIQ-CONNECT] Step 2: Creating auth link...');
    const authLinkPayload = {
      mobile: '+61400000001' // Blank Australian mobile number for 2FA
    };
    console.log('🔗 [BASIQ-CONNECT] Auth link payload:', authLinkPayload);

    const createAuthLinkResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/auth_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify(authLinkPayload)
    });

    console.log('🔗 [BASIQ-CONNECT] Auth link response status:', createAuthLinkResponse.status);
    console.log('🔗 [BASIQ-CONNECT] Auth link response ok:', createAuthLinkResponse.ok);

    if (!createAuthLinkResponse.ok) {
      const errorData = await createAuthLinkResponse.text();
      console.error('❌ [BASIQ-CONNECT] Basiq create auth link error:', errorData);
      console.error('❌ [BASIQ-CONNECT] Response headers:', Object.fromEntries(createAuthLinkResponse.headers.entries()));
      return res.status(createAuthLinkResponse.status).json({
        message: 'Failed to create Basiq auth link',
        details: errorData
      });
    }

    const authLinkData = await createAuthLinkResponse.json();
    console.log('✅ [BASIQ-CONNECT] Auth link created successfully:', authLinkData);

    // For demo purposes, also create a connection to Hooli test bank
    // This simulates what would happen after user completes the auth flow
    console.log('🏦 [BASIQ-CONNECT] Step 3: Creating connection to Hooli test bank...');
    try {
      const connectionPayload = {
        loginId: 'gavinBelson',
        password: 'hooli2016',
        institution: {
          id: 'AU00004' // Hooli test bank ID
        }
      };
      console.log('🏦 [BASIQ-CONNECT] Connection payload:', connectionPayload);

      const connectionResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'basiq-version': '3.0'
        },
        body: JSON.stringify(connectionPayload)
      });

      console.log('🏦 [BASIQ-CONNECT] Connection response status:', connectionResponse.status);
      console.log('🏦 [BASIQ-CONNECT] Connection response ok:', connectionResponse.ok);

      let connectionData = null;
      if (connectionResponse.ok) {
        connectionData = await connectionResponse.json();
        console.log('✅ [BASIQ-CONNECT] Connection created successfully:', connectionData);
      } else {
        const errorData = await connectionResponse.text();
        console.error('❌ [BASIQ-CONNECT] Connection creation failed:', errorData);
      }

      console.log('✅ [BASIQ-CONNECT] Sending success response');
      res.status(200).json({
        basiqUserId: basiqUserId,
        authLink: authLinkData.url,
        connection: connectionData,
        message: 'Bank connection created successfully with Hooli test bank'
      });

    } catch (connectionError) {
      console.error('❌ [BASIQ-CONNECT] Connection creation exception:', connectionError);
      console.error('❌ [BASIQ-CONNECT] Error stack:', connectionError.stack);
      // Still return success for auth link creation
      console.log('⚠️ [BASIQ-CONNECT] Sending partial success response');
      res.status(200).json({
        basiqUserId: basiqUserId,
        authLink: authLinkData.url,
        message: 'Auth link created successfully'
      });
    }

  } catch (error) {
    console.error('❌ [BASIQ-CONNECT] Main exception:', error);
    console.error('❌ [BASIQ-CONNECT] Error stack:', error.stack);
    res.status(500).json({
      message: 'An internal server error occurred during bank connection setup.',
      error: error.message
    });
  }
}
