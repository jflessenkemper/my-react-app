// api/logout.js

import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required.' });
  }

  const pool = new Pool({ connectionString });

  try {
    // Delete the session from the database
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);

    res.status(200).json({ message: 'Logged out successfully.' });

  } catch (error) {
    console.error('Database or server error during logout:', error);
    res.status(500).json({ message: 'An internal server error occurred during logout.' });
  } finally {
    await pool.end();
  }
}
