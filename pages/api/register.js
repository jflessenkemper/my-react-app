// api/register.js

import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs'; // Import bcryptjs for hashing

// Retrieve the database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

// This is the handler function for your Vercel Serverless Function.
// It will be triggered when a request is made to /api/register.
export default async function handler(req, res) {
  // Only allow POST requests for the registration endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password || password.length < 6) { // Minimum password length
    return res.status(400).json({ message: 'Email and password (min 6 characters) are required.' });
  }

  // Create a new database connection pool for this request.
  const pool = new Pool({ connectionString });

  try {
    // 1. Check if user with this email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' }); // 409 Conflict
    }

    // 2. Hash the password
    const saltRounds = 10; // Recommended salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert the new user into the database
    const newUserResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    const newUser = newUserResult.rows[0];

    // Send a success response
    res.status(201).json({ // 201 Created
      message: 'Registration successful! You can now log in.',
      user: { id: newUser.id, email: newUser.email }
    });

  } catch (error) {
    console.error('Database or server error during registration:', error);
    // Generic error message to avoid leaking sensitive information
    res.status(500).json({ message: 'An internal server error occurred during registration.' });
  } finally {
    // Important: Close the database connection pool
    await pool.end();
  }
}
