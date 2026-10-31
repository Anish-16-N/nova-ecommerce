'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nova_super_secret_jwt_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── Generate Token ──────────────────────────────────────────────────────────
/**
 * Generate a signed JWT for the given user ID.
 * @param {string|number} userId
 * @param {Object} [extra] - Additional payload fields
 * @returns {string} signed JWT token
 */
function generateToken(userId, extra = {}) {
  return jwt.sign(
    { sub: String(userId), ...extra },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'nova-api', audience: 'nova-client' }
  );
}

// ─── Verify Token Helper ─────────────────────────────────────────────────────
function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'nova-api',
    audience: 'nova-client',
  });
}

// ─── Extract Token from Request ──────────────────────────────────────────────
function extractToken(req) {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  // 2. Cookie
  if (req.cookies && req.cookies.nova_token) {
    return req.cookies.nova_token;
  }
  return null;
}

// ─── verifyToken Middleware ──────────────────────────────────────────────────
/**
 * Protect a route: requires a valid JWT.
 * Attaches decoded user info to req.user.
 */
async function verifyToken(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyJWT(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role || 'customer',
      email: decoded.email || null,
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.',
        code: 'TOKEN_INVALID',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
}

// ─── optionalAuth Middleware ─────────────────────────────────────────────────
/**
 * Optional auth: attaches user to req if token is present and valid,
 * but does NOT fail if token is absent or invalid.
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyJWT(token);
      req.user = {
        id: decoded.sub,
        role: decoded.role || 'customer',
        email: decoded.email || null,
      };
      req.token = token;
    }
  } catch {
    // Silently ignore invalid/expired tokens in optional auth
    req.user = null;
  }
  next();
}

// ─── requireRole Middleware Factory ─────────────────────────────────────────
/**
 * After verifyToken, check that the user has a required role.
 * @param {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  requireRole,
};
