// api/get-excel-data.js

import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') { // Using POST to send sessionId in body
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { sessionId } = req.body; // Assuming sessionId is sent in body

  if (!sessionId) {
    return res.status(401).json({ message: 'Unauthorized: Session ID is missing.' });
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Validate Session and Get User ID
    const sessionResult = await pool.query(
      'SELECT user_id, expires_at FROM sessions WHERE session_id = $1 AND expires_at > NOW()',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired session.' });
    }
    const userId = sessionResult.rows[0].user_id;

    // 2. Fetch Excel data for the authenticated user
    const excelDataResult = await pool.query(
      'SELECT sheet_data FROM user_excel_data WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );

    if (excelDataResult.rows.length === 0) {
      return res.status(200).json({ message: 'No Excel data found for this user.', excelData: [] });
    }

    // JSONB column automatically parses to JS object/array in node-postgres
    const excelData = excelDataResult.rows[0].sheet_data;

    res.status(200).json({ message: 'Excel data fetched successfully!', excelData: excelData });

  } catch (error) {
    console.error('Error fetching Excel data:', error);
    res.status(500).json({ message: 'An internal server error occurred while fetching Excel data.' });
  } finally {
    await pool.end();
  }
}
