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

    // 3. Parse the Excel file and validate 'Overview' sheet
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const overviewSheetName = 'Overview';

    if (!workbook.SheetNames.includes(overviewSheetName)) {
      return res.status(400).json({ message: 'Excel file must contain an \'Overview\' sheet.' });
    }

    const worksheet = workbook.Sheets[overviewSheetName];

    const dataSchema = [
      {
        cellRange: "K6:AD6",
        description: "Time interval headers",
        fieldName: "frequency_interval",
        dataType: "string"
      },
      {
        cellRange: "J7",
        description: "Income source label 1",
        fieldName: "income_source_1",
        dataType: "string"
      },
      {
        cellRange: "K7:AD7",
        description: "Income source 1 values by time interval",
        fieldName: "income_source_1_values",
        dataType: "decimal"
      },
      {
        cellRange: "J8",
        description: "Income source label 2",
        fieldName: "income_source_2",
        dataType: "string"
      },
      {
        cellRange: "K8:AD8",
        description: "Income source 2 values by time interval",
        fieldName: "income_source_2_values",
        dataType: "decimal"
      },
      {
        cellRange: "J18",
        description: "Total income label",
        fieldName: "income_total_label",
        dataType: "string"
      },
      {
        cellRange: "K18:AD18",
        description: "Total income values by time interval",
        fieldName: "income_totals",
        dataType: "decimal"
      },
      {
        cellRange: "J23:J34",
        description: "Expense category labels",
        fieldName: "expense_categories",
        dataType: "string"
      },
      {
        cellRange: "K23:AD34",
        description: "Expense values by category and time interval",
        fieldName: "expense_values",
        dataType: "decimal"
      },
      {
        cellRange: "J35",
        description: "Total expenses label",
        fieldName: "expense_total_label",
        dataType: "string"
      },
      {
        cellRange: "K35:AD35",
        description: "Total expenses by time interval",
        fieldName: "expense_totals",
        dataType: "decimal"
      },
      {
        cellRange: "J38",
        description: "Profit/Loss overview section header",
        fieldName: "profit_loss_section_label",
        dataType: "string"
      },
      {
        cellRange: "J40",
        description: "Profit/Loss row label",
        fieldName: "profit_loss_label",
        dataType: "string"
      },
      {
        cellRange: "K40:AD40",
        description: "Profit/Loss values by time interval",
        fieldName: "profit_loss_values",
        dataType: "decimal"
      }
    ];

    const extractedData = {};

    for (const item of dataSchema) {
      const range = XLSX.utils.decode_range(item.cellRange);
      const values = [];

      if (range.s.r === range.e.r && range.s.c === range.e.c) { // Single cell
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: range.s.c });
        const cell = worksheet[cellAddress];
        let value = (cell && cell.v !== undefined) ? cell.v : null;
        if (item.dataType === 'decimal' && value !== null) {
          value = parseFloat(value);
          if (isNaN(value)) value = null; // Handle non-numeric values gracefully
        }
        extractedData[item.fieldName] = value;
      } else if (range.s.c === range.e.c) { // Single column range (e.g., J23:J34)
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: range.s.c });
          const cell = worksheet[cellAddress];
          let value = (cell && cell.v !== undefined) ? cell.v : null;
          if (item.dataType === 'decimal' && value !== null) {
            value = parseFloat(value);
            if (isNaN(value)) value = null;
          }
          values.push(value);
        }
        extractedData[item.fieldName] = JSON.stringify(values); // Store as JSON string
      }
      else { // Horizontal range (e.g., K6:AD6)
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const cell = worksheet[cellAddress];
          let value = (cell && cell.v !== undefined) ? cell.v : null;
          if (item.dataType === 'decimal' && value !== null) {
            value = parseFloat(value);
            if (isNaN(value)) value = null;
          }
          values.push(value);
        }
        extractedData[item.fieldName] = JSON.stringify(values); // Store as JSON string
      }
    }

    // 4. Store the structured data in the database
    await pool.query('DELETE FROM user_excel_data WHERE user_id = $1', [userId]);

    const columns = Object.keys(extractedData).join(', ');
    const placeholders = Object.keys(extractedData).map((_, i) => `$${i + 4}`).join(', '); // $1=userId, $2=fileName
    const values = Object.values(extractedData);

    const insertQuery = `INSERT INTO user_excel_data (user_id, file_name, ${columns}) VALUES ($1, $2, ${placeholders})`;

    await pool.query(
      insertQuery,
      [userId, fileName, ...values] 
    );

    res.status(200).json({ message: 'Excel file uploaded and processed successfully!', data: extractedData });

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
