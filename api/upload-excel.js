// api/upload-excel.js

import { Pool } from '@neondatabase/serverless';
import * as XLSX from 'xlsx'; // Import the xlsx library

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { sessionId, excelFileBase64, fileName } = req.body; // Expect base64 string and filename

  if (!sessionId || !excelFileBase64 || !fileName) {
    return res.status(400).json({ message: 'Missing session ID, file data, or file name.' });
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

    // 2. Decode the Base64 string back into a Buffer
    const excelBuffer = Buffer.from(excelFileBase64, 'base64');

    // 3. Parse the Excel file (first sheet only)
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet name
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convert sheet to JSON array of objects

    // 4. Store in the database (replace existing data for this user)
    // To ensure "only show this data for the user who submitted it", we'll DELETE any
    // previous Excel data for this user before inserting the new one.
    // This assumes a user only has one active Excel data upload at a time.
    await pool.query('DELETE FROM user_excel_data WHERE user_id = $1', [userId]);

    await pool.query(
      'INSERT INTO user_excel_data (user_id, file_name, sheet_data) VALUES ($1, $2, $3)',
      [userId, fileName, JSON.stringify(jsonData)] // Store JSON as string, JSONB handles it
    );

    res.status(200).json({ message: 'Excel file uploaded and processed successfully!' });

  } catch (error) {
    console.error('Error processing Excel upload:', error);
    // Provide a more specific error message based on common XLSX failures
    if (error.message.includes("Cannot read property 'SheetNames' of undefined") || error.message.includes("Unsupported shared string table") || error.message.includes("file is not a zip file")) {
        return res.status(400).json({ message: 'Invalid Excel file format or corrupted file. Please upload a valid .xlsx or .xls file.' });
    }
    res.status(500).json({ message: 'An internal server error occurred during Excel processing.' });
  } finally {
    await pool.end();
  }
}
