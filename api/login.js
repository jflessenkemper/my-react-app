// api/login.js

import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs'; // Import bcryptjs

// Retrieve the database connection string from environment variables
// Vercel automatically injects these from your project settings.
const connectionString = process.env.DATABASE_URL;

// This is the handler function for your Vercel Serverless Function.
// It will be triggered when a request is made to /api/login.
export default async function handler(req, res) {
  // Only allow POST requests for the login endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Create a new database connection pool for this request.
  // The @neondatabase/serverless driver handles efficient pooling internally for serverless.
  const pool = new Pool({ connectionString });

  try {
    // Query the database to find a user by their email
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);

    // If no user is found with the provided email
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const hashedPassword = user.password_hash;

    // Compare the provided plain-text password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // If credentials are valid, send a success response
    // In a real application, you would generate and return a JWT (JSON Web Token) here
    // for the client to use for subsequent authenticated requests.
    res.status(200).json({
      message: 'Login successful!',
      user: { id: user.id, email: user.email } // Return limited user info for security
      // You would add token: 'YOUR_GENERATED_JWT_HERE' in a real app
    });

  } catch (error) {
    console.error('Database or server error during login:', error);
    // Generic error message to avoid leaking sensitive information
    res.status(500).json({ message: 'An internal server error occurred.' });
  } finally {
    // Important: Close the database connection pool after the request is handled
    await pool.end();
  }
}
