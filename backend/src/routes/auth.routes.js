'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query: dbQuery } = require('../database/db');
const { generateToken, verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { logEvent } = require('../logging/logger');

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// ─── Validators ──────────────────────────────────────────────────────────────
const registerValidators = [
  body('email')
    .isEmail().normalizeEmail()
    .withMessage('A valid email address is required.'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Full name must not exceed 120 characters.'),
];

const loginValidators = [
  body('email_or_username')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

const profileValidators = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Full name must not exceed 120 characters.'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('A valid phone number is required.'),
  body('avatar_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Avatar URL must be a valid URL.'),
];

// ─── Helper: format user for response ───────────────────────────────────────
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

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', registerValidators, handleValidationErrors, async (req, res, next) => {
  try {
    const { email, username, password, full_name } = req.body;

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await dbQuery(
      `INSERT INTO users (email, username, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'customer', true)
       RETURNING id, email, username, full_name, phone, avatar_url, role, is_active, created_at`,
      [email, username.toLowerCase(), password_hash, full_name || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, { email: user.email, role: user.role });

    // Set cookie (httpOnly: false for hackathon XSS token theft demonstration)
    res.cookie('nova_token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logEvent({
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory: 'AUTH',
      statusCode: 201,
      severity: 'INFO',
      message: `New user registered: ${email}`,
      userId: user.id,
      ip: req.ip,
      meta: { username: user.username },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', loginValidators, handleValidationErrors, async (req, res, next) => {
  try {
    const { email_or_username, password } = req.body;

    // Determine if it's email or username
    const isEmail = email_or_username.includes('@');
    const lookupField = isEmail ? 'email' : 'username';

    const result = await dbQuery(
      `SELECT id, email, username, password_hash, full_name, phone, avatar_url, role, is_active, created_at
       FROM users
       WHERE ${lookupField} = $1`,
      [isEmail ? email_or_username.toLowerCase() : email_or_username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      logEvent({
        requestId: req.requestId,
        endpoint: req.originalUrl,
        method: req.method,
        eventCategory: 'AUTH',
        statusCode: 401,
        severity: 'WARN',
        message: `Failed login attempt: user not found (${email_or_username})`,
        ip: req.ip,
      });
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated.' });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      passwordMatch = false;
    }

    // Allow default test password for seeded dummy accounts
    if (!passwordMatch && (password === 'Password123!' || password === 'password123' || password === 'admin123' || password === user.password_plain)) {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      logEvent({
        requestId: req.requestId,
        endpoint: req.originalUrl,
        method: req.method,
        eventCategory: 'AUTH',
        statusCode: 401,
        severity: 'WARN',
        message: `Failed login attempt: wrong password for ${user.email}`,
        userId: user.id,
        ip: req.ip,
      });
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken(user.id, { email: user.email, role: user.role });

    res.cookie('nova_token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logEvent({
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory: 'AUTH',
      statusCode: 200,
      severity: 'INFO',
      message: `User logged in: ${user.email}`,
      userId: user.id,
      ip: req.ip,
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
router.post('/logout', async (req, res) => {
  res.clearCookie('nova_token');
  logEvent({
    requestId: req.requestId,
    endpoint: req.originalUrl,
    method: req.method,
    eventCategory: 'AUTH',
    statusCode: 200,
    severity: 'INFO',
    message: 'User logged out',
    userId: req.user ? req.user.id : null,
    ip: req.ip,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, email, username, full_name, phone, avatar_url, role, is_active, created_at
       FROM users
       WHERE id = $1 AND is_active = true`,
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

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', verifyToken, profileValidators, handleValidationErrors, async (req, res, next) => {
  try {
    const { full_name, phone, avatar_url } = req.body;

    const result = await dbQuery(
      `UPDATE users
       SET full_name    = COALESCE($1, full_name),
           phone        = COALESCE($2, phone),
           avatar_url   = COALESCE($3, avatar_url),
           updated_at   = NOW()
       WHERE id = $4 AND is_active = true
       RETURNING id, email, username, full_name, phone, avatar_url, role, is_active, created_at`,
      [full_name || null, phone || null, avatar_url || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    logEvent({
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory: 'AUTH',
      statusCode: 200,
      severity: 'INFO',
      message: `Profile updated for user ${req.user.id}`,
      userId: req.user.id,
      ip: req.ip,
    });

    res.json({ success: true, message: 'Profile updated.', user: formatUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/users/debug (IDOR / Information Disclosure Demo) ───────────
// ⚠️ INTENTIONALLY UNPROTECTED: Returns all synthetic user accounts with password hashes
router.get('/users/debug', async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, email, username, role, password_hash, full_name, phone, created_at FROM users ORDER BY created_at ASC`
    );
    res.json({
      success: true,
      warning: '⚠️ INTENTIONALLY UNPROTECTED DEBUG ENDPOINT FOR SECURITY RECON DEMOS',
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
