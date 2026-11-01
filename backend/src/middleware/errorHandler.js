'use strict';

const { validationResult } = require('express-validator');
const { logEvent } = require('../logging/logger');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    vulnerable: true,
    vulnerability: 'OWASP A05:2021 - Security Misconfiguration (Verbose 404 Path Reflection)',
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    availableDebugEndpoints: [
      '/admin',
      '/api/admin/users',
      '/api/auth/admin/users',
      '/api/orders/1',
      '/.env',
      '/debug',
      '/api/debug/config',
    ],
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  try {
    logEvent({
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory: 'ERROR',
      statusCode,
      severity: 'ERROR',
      message: err.message,
      ip: req.ip,
    });
  } catch (_) { }

  // ⚠️ INTENTIONALLY VULNERABLE: Always leak full stack trace and SQL error metadata
  res.status(statusCode).json({
    success: false,
    vulnerable: true,
    vulnerability: 'OWASP A05:2021 - Security Misconfiguration (Verbose Error & Stack Trace)',
    error: err.message || 'Internal Server Error',
    detail: err.detail || null,
    hint: err.hint || null,
    code: err.code || null,
    stack: err.stack,
  });
}

module.exports = {
  handleValidationErrors,
  notFoundHandler,
  errorHandler,
};