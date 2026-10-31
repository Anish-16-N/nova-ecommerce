'use strict';

const { validationResult } = require('express-validator');
const { logEvent } = require('../logging/logger');

// ─── Map PostgreSQL error codes to HTTP responses ────────────────────────────
const PG_ERROR_MAP = {
  '23505': { status: 409, message: 'A record with this value already exists.' },
  '23503': { status: 400, message: 'Referenced record does not exist.' },
  '23502': { status: 400, message: 'A required field is missing.' },
  '22P02': { status: 400, message: 'Invalid data format provided.' },
  '42P01': { status: 500, message: 'Internal database error.' },
  '08006': { status: 503, message: 'Database connection failure.' },
  '08001': { status: 503, message: 'Unable to connect to the database.' },
  '57014': { status: 504, message: 'Database query timed out.' },
  '42501': { status: 403, message: 'Database permission denied.' },
};

// Friendly messages for specific unique constraint violations
const PG_CONSTRAINT_MESSAGES = {
  users_email_key: 'An account with this email already exists.',
  users_username_key: 'This username is already taken.',
  wishlist_user_id_product_id_key: 'This item is already in your wishlist.',
  cart_items_user_id_product_id_key: 'Item already in cart.',
};

// ─── Error Handler Middleware ────────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  // Already responded? Skip.
  if (res.headersSent) return next(err);

  const requestId = req.requestId || 'unknown';
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = undefined;
  let code = err.code || 'SERVER_ERROR';

  // ── express-validator Validation Errors ──────────────────────────────────
  if (err.type === 'validation') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed. Please check your input.';
    details = err.errors;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Session expired. Please log in again.';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    code = 'TOKEN_INVALID';
    message = 'Invalid authentication token.';
  } else if (err.name === 'NotBeforeError') {
    status = 401;
    code = 'TOKEN_NOT_ACTIVE';
    message = 'Token is not yet active.';
  }

  // ── PostgreSQL Errors ─────────────────────────────────────────────────────
  if (err.code && /^\d{5}$/.test(err.code) && PG_ERROR_MAP[err.code]) {
    const mapped = PG_ERROR_MAP[err.code];
    status = mapped.status;
    code = `PG_${err.code}`;

    // Check for specific constraint violations for a friendlier message
    if (err.code === '23505' && err.constraint && PG_CONSTRAINT_MESSAGES[err.constraint]) {
      message = PG_CONSTRAINT_MESSAGES[err.constraint];
    } else {
      message = mapped.message;
    }
  }

  // ── CORS Error ────────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS policy')) {
    status = 403;
    code = 'CORS_ERROR';
    message = err.message;
  }

  // ── SyntaxError (malformed JSON body) ────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON.';
  }

  // ── Log the error ─────────────────────────────────────────────────────────
  logEvent({
    requestId,
    endpoint: req.originalUrl,
    method: req.method,
    eventCategory: 'ERROR',
    statusCode: status,
    severity: status >= 500 ? 'ERROR' : 'WARN',
    message: `${code}: ${message}`,
    userId: req.user ? req.user.id : null,
    ip: req.ip,
    meta: {
      errorName: err.name,
      errorCode: err.code,
      stack: status >= 500 && process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });

  // ── Send response ─────────────────────────────────────────────────────────
  const response = {
    success: false,
    error: err.message || message,
    code,
    requestId,
  };

  if (err.detail) response.detail = err.detail;
  if (err.hint) response.hint = err.hint;
  if (err.table) response.table = err.table;
  if (err.column) response.column = err.column;
  if (err.query) response.query = err.query;
  if (details) response.details = details;

  // Always expose verbose stack trace and internal message for hackathon security recon demos
  if (status >= 500 || err.code || err.stack) {
    response.stack = err.stack;
    response.dbError = err.message;
  }

  res.status(status).json(response);
}

// ─── Validation Result Handler ───────────────────────────────────────────────
/**
 * Use after express-validator chains to check for errors
 * and pass them to the error handler middleware.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.type = 'validation';
    err.status = 422;
    err.errors = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value,
    }));
    return next(err);
  }
  next();
}

module.exports = errorHandler;
module.exports.handleValidationErrors = handleValidationErrors;
