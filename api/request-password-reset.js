import { Pool } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid'; // For generating unique reset codes
import nodemailer from 'nodemailer'; // For sending emails (placeholder)

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const pool = new Pool({ connectionString });

  try {
    // Check if the user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Return a generic success message to prevent email enumeration
      return res.status(200).json({ message: 'If an account with that email exists, a password reset code has been sent.' });
    }

    const userId = userResult.rows[0].id;

    // Generate a 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate any existing codes for this user
    await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId]);

    // Store the new code in the database
    await pool.query(
      'INSERT INTO password_reset_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [userId, resetCode, expirationTime]
    );

    // TODO: Implement actual email sending using a service like SendGrid, Mailgun, or nodemailer with a real SMTP setup.
    // For now, we'll just log the code.
    console.log(`Password Reset Code for ${email}: ${resetCode}`);

    // Example with nodemailer (requires configuration):
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your SMTP service
      auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password'
      }
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${resetCode}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    */

    res.status(200).json({ message: 'If an account with that email exists, a password reset code has been sent. This code is valid for 10 minutes.' });

  } catch (error) {
    console.error('Database or server error during password reset request:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  } finally {
    // Removed pool.end() as it can cause issues in serverless environments.
  }
} 