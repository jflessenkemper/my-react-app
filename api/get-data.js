// api/get-data.js

// Ensure you use 'Pool' for connection pooling in serverless environments
// or the 'neon' tagged template literal function for single-shot queries over HTTP.
// For more complex interactions, Pool/Client are often better for transaction/session support.
import { Pool } from '@neondatabase/serverless';

// The DATABASE_URL environment variable will be set in your Vercel project settings
const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  // Allow only GET requests for data fetching
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Create a new pool for each invocation in serverless,
  // and ensure it's closed. The Neon driver handles pooling
  // efficiently internally.
  const pool = new Pool({ connectionString });

  try {
    // Example: Fetching some data from your database
    const { rows } = await pool.query('SELECT NOW() as current_server_time');

    // Replace with your actual database query, e.g.:
    // const { rows } = await pool.query('SELECT id, name, amount FROM budget_items ORDER BY id DESC LIMIT 10');

    res.status(200).json({
      message: 'Data fetched successfully!',
      data: rows[0].current_server_time // Or your actual data: rows
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch data from the database.' });
  } finally {
    await pool.end(); // Crucial: close the pool in a serverless function
  }
}