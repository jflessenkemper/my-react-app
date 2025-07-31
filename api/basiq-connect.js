// api/basiq-connect.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userEmail, sessionId } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  if (!userEmail || !sessionId) {
    return res.status(400).json({ message: 'User email and session ID are required' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    // Step 1: Create a Basiq user
    const createUserResponse = await fetch('https://au-api.basiq.io/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({
        email: userEmail,
        mobile: '+61400000001', // Blank Australian mobile number
        firstName: userEmail.split('@')[0], // Use email prefix as first name
        lastName: 'User'
      })
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error('Basiq create user error:', errorData);
      return res.status(createUserResponse.status).json({ 
        message: 'Failed to create Basiq user' 
      });
    }

    const userData = await createUserResponse.json();
    const basiqUserId = userData.id;

    // Step 2: Create an auth link for the user
    const createAuthLinkResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/auth_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({
        mobile: '+61400000001' // Blank Australian mobile number for 2FA
      })
    });

    if (!createAuthLinkResponse.ok) {
      const errorData = await createAuthLinkResponse.text();
      console.error('Basiq create auth link error:', errorData);
      return res.status(createAuthLinkResponse.status).json({ 
        message: 'Failed to create Basiq auth link' 
      });
    }

    const authLinkData = await createAuthLinkResponse.json();

    // For demo purposes, also create a connection to Hooli test bank
    // This simulates what would happen after user completes the auth flow
    try {
      const connectionResponse = await fetch(`https://au-api.basiq.io/users/${basiqUserId}/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'basiq-version': '3.0'
        },
        body: JSON.stringify({
          loginId: 'gavinBelson',
          password: 'hooli2016',
          institution: {
            id: 'AU00004' // Hooli test bank ID
          }
        })
      });

      let connectionData = null;
      if (connectionResponse.ok) {
        connectionData = await connectionResponse.json();
      }

      res.status(200).json({
        basiqUserId: basiqUserId,
        authLink: authLinkData.url,
        connection: connectionData,
        message: 'Bank connection created successfully with Hooli test bank'
      });

    } catch (connectionError) {
      console.error('Connection creation error:', connectionError);
      // Still return success for auth link creation
      res.status(200).json({
        basiqUserId: basiqUserId,
        authLink: authLinkData.url,
        message: 'Auth link created successfully'
      });
    }

  } catch (error) {
    console.error('Basiq connection error:', error);
    res.status(500).json({ 
      message: 'An internal server error occurred during bank connection setup.' 
    });
  }
}
