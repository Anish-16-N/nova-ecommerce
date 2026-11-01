'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { query: dbQuery } = require('../database/db');
const { generateToken, verifyToken } = require('../middleware/auth');
const { logEvent } = require('../logging/logger');

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.full_name,
    phone: user.phone,
    avatar_url: user.avatar_url,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}

// ─── POST /api/auth/register (Broken Access Control: Mass Assignment of `role`) ─
router.post('/register', async (req, res, next) => {
  try {
    const {
      email,
      username,
      password = 'password123',
      full_name,
      role = 'customer',
    } = req.body;

    if (!email || !username) {
      return res.status(400).json({ success: false, error: 'Email and username are required.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await dbQuery(
      `INSERT INTO users (email, username, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, username, full_name, phone, avatar_url, role, is_active, created_at`,
      [email, username.toLowerCase(), password_hash, full_name || null, role]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, { email: user.email, role: user.role });

    // ⚠️ Security Misconfiguration: httpOnly: false allows XSS cookie theft
    res.cookie('nova_token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      vulnerable: role !== 'customer',
      message: 'Account created successfully.',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login (Supports SQLi Auth Bypass + Weak Passwords) ───────
router.post('/login', async (req, res, next) => {
  try {
    const { email_or_username = '', username = '', email = '', password = '' } = req.body;
    const identifier = (email_or_username || username || email).trim();

    // ⚠️ SQL Injection Auth Bypass if input contains SQLi characters or ?vuln=true
    if (
      req.query.vuln === 'true' ||
      identifier.includes("'") ||
      identifier.includes('--') ||
      password.includes("'")
    ) {
      const rawSql = `SELECT id, email, username, password_hash, full_name, phone, avatar_url, role, is_active, created_at FROM users WHERE username = '${identifier}' OR email = '${identifier}'`;
      const rawResult = await dbQuery(rawSql);
      if (rawResult.rows.length > 0) {
        const user = rawResult.rows[0];
        const token = generateToken(user.id, { email: user.email, role: user.role });
        res.cookie('nova_token', token, { httpOnly: false, secure: false, sameSite: 'lax' });
        return res.json({
          success: true,
          bypassed: true,
          vulnerable: true,
          vulnerability: 'SQL Injection Authentication Bypass',
          query: rawSql,
          token,
          user: formatUser(user),
        });
      }
    }

    const isEmail = identifier.includes('@');
    const lookupField = isEmail ? 'email' : 'username';

    const result = await dbQuery(
      `SELECT id, email, username, password_hash, full_name, phone, avatar_url, role, is_active, created_at
       FROM users
       WHERE ${lookupField} = $1`,
      [identifier.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (_) {
      passwordMatch = false;
    }

    if (
      !passwordMatch &&
      ['Password123!', 'password123', 'admin123', 'admin'].includes(password)
    ) {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken(user.id, { email: user.email, role: user.role });

    res.cookie('nova_token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('nova_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, email, username, full_name, phone, avatar_url, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user: formatUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/auth/profile (Broken Access Control: Mass Assignment of `role`) ─
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const { full_name, phone, avatar_url, role } = req.body;
    const result = await dbQuery(
      `UPDATE users
       SET full_name  = COALESCE($1, full_name),
           phone      = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           role       = COALESCE($4, role),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, username, full_name, phone, avatar_url, role, is_active, created_at`,
      [full_name || null, phone || null, avatar_url || null, role || null, req.user.id]
    );

    res.json({
      success: true,
      vulnerable: Boolean(role),
      message: 'Profile updated.',
      user: formatUser(result.rows[0]),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/admin/users & /api/auth/users (Broken Access Control) ─────
router.get(['/admin/users', '/users', '/users/debug'], async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT id, email, username, password_hash, full_name, phone, role, is_active, created_at FROM users ORDER BY id ASC'
    );
    res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A01:2021 - Broken Access Control (Unauthenticated User Dump)',
      count: result.rows.length,
      users: result.rows,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;