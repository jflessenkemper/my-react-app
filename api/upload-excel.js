// api/upload-excel.js

import { Pool } from '@neondatabase/serverless';
import * as XLSX from 'xlsx'; // Import the xlsx library

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const sessionId = req.body.sessionId; // Assuming sessionId is sent in FormData

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

    // Vercel serverless functions handle file uploads in req.body as a buffer
    // when 'Content-Type' is 'application/octet-stream' or multipart is parsed.
    // For FormData, `req.body` will be an object. We need to parse the multipart data.
    // However, for simplicity, we assume the frontend sends a single file via FormData,
    // and Vercel's default handling makes it available as a 'file' part if sent correctly.
    // For more complex multipart handling, you might need a library like 'formidable' or 'busboy'.

    // In a Vercel serverless environment, when using FormData on the frontend,
    // the file will typically be available via `req.file` if a middleware
    // (like `multer` on Express) was used, or you manually parse `req.body`
    // for multipart data.
    // For simplicity, let's assume the file data comes directly as a Buffer.
    // If you send it as a base64 string, you'll need to decode it.
    // The `formData.append('excelFile', excelFile);` from frontend will often result in
    // a readable stream or a direct buffer from Vercel's parsing.

    // A more direct way to handle files in Vercel's Node.js environment with FormData:
    // When `body` is a FormData object, Vercel will process it. `req.body` will then
    // contain the parsed fields. For files, they are usually streamed or put in a temp location.
    // A robust way to handle it directly in Vercel functions without external middleware:
    // Vercel's req.body for multipart/form-data can be complex.
    // A common workaround is to convert the file to a Base64 string on the frontend
    // and send it as JSON, or use a specific Vercel API pattern for file uploads.

    // Given the prompt and typical serverless function usage,
    // let's assume `req.body` is already parsed for common file formats,
    // or you're sending a base64 encoded string.
    // For this example, let's try reading the incoming form data directly.
    // (If this fails on Vercel, a common fix is to base64 encode on frontend and decode here).

    // Let's adapt based on common Vercel body parsing for simple file uploads
    // when using `FormData` from the browser.
    // `req.body` will be the parsed FormData. `req.files` might also exist or the
    // file content is directly accessible via `req.body.excelFile` which could be a Buffer.

    let excelBuffer;
    let fileName = 'uploaded_excel.xlsx'; // Default name

    // If using 'form-data' without complex parsing setup, Vercel might give you `req.body` as a Buffer
    // when the content-type is `application/octet-stream`. If sending as FormData,
    // the field `excelFile` needs to contain the buffer or a base64 string.

    // Simple check: if req.body is a buffer (e.g., from direct file input)
    if (req.body instanceof Buffer) {
      excelBuffer = req.body;
      fileName = req.headers['x-file-name'] || fileName; // Try to get original filename
    } else if (req.body && req.body.excelFile) {
      // This path is for when FormData includes other fields and the file as a field.
      // Often, `req.body.excelFile` itself will be a Buffer or have a `.data` property.
      excelBuffer = req.body.excelFile.data || req.body.excelFile; // Adjust based on how Vercel presents it
      fileName = req.body.excelFile.name || fileName;
    } else {
        // Fallback for cases where file isn't directly a buffer or in excelFile field
        // Consider having frontend base64 encode large files for simpler JSON body parsing.
        return res.status(400).json({ message: 'No Excel file found in the request body.' });
    }

    if (!excelBuffer) {
      return res.status(400).json({ message: 'Could not read Excel file data.' });
    }

    // 2. Parse the Excel file (first sheet only)
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet name
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convert sheet to JSON array of objects

    // 3. Store in the database (replace existing data for this user)
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
    if (error.message.includes("Cannot read property 'SheetNames' of undefined") || error.message.includes("Unsupported shared string table") || error.message.includes("file is not a zip file")) {
        return res.status(400).json({ message: 'Invalid Excel file format or corrupted file.' });
    }
    res.status(500).json({ message: 'An internal server error occurred during Excel processing.' });
  } finally {
    await pool.end();
  }
}
