export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    // Simple validation (replace with your database logic)
    if (email === 'test@example.com' && password === 'testpassword') {
      res.status(200).json({ message: 'Login successful', user: { id: 1, email } });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}