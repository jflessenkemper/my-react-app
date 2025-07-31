// api/basiq-create-user.js

export default async function handler(req, res) {
  console.log('👤 [BASIQ-CREATE-USER] Request received');
  console.log('👤 [BASIQ-CREATE-USER] Method:', req.method);
  console.log('👤 [BASIQ-CREATE-USER] Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ [BASIQ-CREATE-USER] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, mobile } = req.body;

  if (!email) {
    console.log('❌ [BASIQ-CREATE-USER] Missing email');
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // First, get a SERVER_ACCESS token
    console.log('👤 [BASIQ-CREATE-USER] Getting SERVER_ACCESS token...');
    const authResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/basiq-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scope: 'SERVER_ACCESS' })
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('❌ [BASIQ-CREATE-USER] Auth failed:', authError);
      return res.status(500).json({ message: 'Failed to authenticate with Basiq' });
    }

    const authData = await authResponse.json();
    console.log('✅ [BASIQ-CREATE-USER] Got SERVER_ACCESS token');

    // Create Basiq user
    console.log('👤 [BASIQ-CREATE-USER] Creating Basiq user...');
    const userData = {
      email: email
    };

    // Add mobile if provided
    if (mobile) {
      userData.mobile = mobile;
    }

    const createUserResponse = await fetch('https://au-api.basiq.io/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify(userData)
    });

    console.log('👤 [BASIQ-CREATE-USER] Create user response status:', createUserResponse.status);

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error('❌ [BASIQ-CREATE-USER] Create user error:', errorData);
      return res.status(createUserResponse.status).json({
        message: 'Failed to create Basiq user',
        details: errorData
      });
    }

    const userData_response = await createUserResponse.json();
    console.log('✅ [BASIQ-CREATE-USER] User created successfully');
    console.log('✅ [BASIQ-CREATE-USER] User ID:', userData_response.id);

    res.status(200).json({
      basiqUserId: userData_response.id,
      email: userData_response.email,
      mobile: userData_response.mobile,
      created: userData_response.created
    });

  } catch (error) {
    console.error('❌ [BASIQ-CREATE-USER] Exception:', error);
    res.status(500).json({
      message: 'An internal server error occurred during user creation.',
      error: error.message
    });
  }
}
