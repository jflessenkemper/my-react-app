import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, code, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Verify the reset code and its expiration
    const codeResult = await pool.query(
      'SELECT prc.user_id, u.email FROM password_reset_codes prc JOIN users u ON prc.user_id = u.id WHERE prc.code = $1 AND u.email = $2 AND prc.expires_at > NOW()',
      [code, email]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired password reset code.' });
    }

    const userId = codeResult.rows[0].user_id;

    // 2. Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 3. Update the user's password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    // 4. Invalidate (delete) the used reset code
    await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId]);

    res.status(200).json({ message: 'Password has been reset successfully!' });

  } catch (error) {
    console.error('Database or server error during password reset:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  } finally {
    await pool.end();
  }
} 