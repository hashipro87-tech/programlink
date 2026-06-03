// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../config/database');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

function generateToken(userId, email, role, orgId, sponsorId) {
  return jwt.sign(
    { id: userId, email, role, organizationId: orgId, sponsorId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, orgId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required.' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const password_hash      = await bcrypt.hash(password, 12);
    const verification_token = randomToken();
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, org_id, is_verified, verification_token)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6)
       RETURNING id, name, email, role, org_id`,
      [name, email, password_hash, role, orgId || null, verification_token]
    );
    const user = result.rows[0];
    sendVerificationEmail(email, verification_token, name).catch((err) =>
      console.error('Failed to send verification email:', err.message)
    );
    res.status(201).json({
      message: 'Account created. Please check your email to verify your address.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await pool.query(
      `SELECT u.*, o.sponsor_id
       FROM users u
       LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.is_verified === false) {
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    const token = generateToken(user.id, user.email, user.role, user.org_id, user.sponsor_id);
    res.json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        orgId: user.org_id,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.org_id, u.is_active, u.last_login_at,
              o.name AS org_name, o.type AS org_type, o.sponsor_id
       FROM users u
       LEFT JOIN organizations o ON o.id = u.org_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Could not fetch user.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is missing.' });
    }
    const result = await pool.query(
      'SELECT id, is_verified FROM users WHERE verification_token = $1',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }
    const user = result.rows[0];
    if (user.is_verified) {
      return res.json({ message: 'Email already verified. You can sign in.' });
    }
    await pool.query(
      `UPDATE users SET is_verified = TRUE, verified_at = NOW(), verification_token = NULL WHERE id = $1`,
      [user.id]
    );
    res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const result = await pool.query(
      'SELECT id, name, email, is_verified FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a verification link has been sent.' });
    }
    const user = result.rows[0];
    if (user.is_verified) {
      return res.json({ message: 'This email is already verified. You can sign in.' });
    }
    const newToken = randomToken();
    await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [newToken, user.id]);
    sendVerificationEmail(user.email, newToken, user.name).catch((err) =>
      console.error('Failed to resend verification email:', err.message)
    );
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('resendVerification error:', err);
    res.status(500).json({ error: 'Could not resend verification email. Please try again.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    const user       = result.rows[0];
    const resetToken = randomToken();
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );
    sendPasswordResetEmail(user.email, resetToken, user.name).catch((err) =>
      console.error('Failed to send password reset email:', err.message)
    );
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Could not send reset email. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const result = await pool.query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2`,
      [password_hash, result.rows[0].id]
    );
    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};
