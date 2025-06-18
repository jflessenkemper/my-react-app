// api/login.js

import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // For generating unique session IDs

// Retrieve the database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

// This is the handler function for your Vercel Serverless Function.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Find the user by email
    const userResult = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    const hashedPassword = user.password_hash;

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Get client IP address
    // Vercel sets the real client IP in 'x-forwarded-for' header
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // 4. Create a new session for the user
    const sessionId = uuidv4(); // Generate a unique session ID
    const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'INSERT INTO sessions (session_id, user_id, ip_address, expires_at) VALUES ($1, $2, $3, $4)',
      [sessionId, user.id, ipAddress, expirationTime]
    );

    // 5. Return success response with session details
    res.status(200).json({
      message: 'Login successful!',
      user: { id: user.id, email: user.email },
      sessionId: sessionId,
      expiresAt: expirationTime.toISOString(), // Send as ISO string for easy parsing on frontend
    });

  } catch (error) {
    console.error('Database or server error during login:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  } finally {
    await pool.end(); // Close the database connection
  }
}
