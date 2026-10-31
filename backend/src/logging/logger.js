'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Dual Log file destinations ──────────────────────────────────────────────
// Ensures logs appear both in <workspace>/logs and <nova-ecommerce>/logs
const LOG_FILES = [
  path.resolve(__dirname, '../../../logs/app.log.jsonl'),       // d:\Kodikon 6.0\nova-ecommerce\logs\app.log.jsonl
  path.resolve(__dirname, '../../../../logs/app.log.jsonl'),      // d:\Kodikon 6.0\logs\app.log.jsonl
];

// Ensure all log directories exist
for (const file of LOG_FILES) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.error('[Logger] Could not create log directory for', file, e.message);
  }
}

// ─── Sensitive field redaction ───────────────────────────────────────────────
const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'passwordHash',
  'token', 'accessToken', 'refreshToken', 'access_token', 'refresh_token',
  'authorization', 'Authorization',
  'card_number', 'cardNumber', 'cvv', 'cvc', 'card_cvv',
  'secret', 'jwt', 'apiKey', 'api_key',
  'ssn', 'pin',
]);

function redactSensitive(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

// Redact card numbers from strings (16-digit sequences)
function redactString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\b\d{16}\b/g, '[CARD_REDACTED]');
}

// ─── Core logEvent function ──────────────────────────────────────────────────
/**
 * Write a structured JSONL log entry.
 *
 * @param {Object} options
 * @param {string} [options.requestId]
 * @param {string} [options.endpoint]
 * @param {string} [options.method]
 * @param {string} [options.eventCategory]  - e.g. 'AUTH', 'CART', 'ORDER', 'PRODUCT', 'REVIEW', 'SYSTEM'
 * @param {number} [options.statusCode]
 * @param {number} [options.responseTime]   - milliseconds
 * @param {string} [options.severity]       - 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
 * @param {string} [options.detectionResult] - for security lab: 'SAFE' | 'VULNERABLE' | 'BLOCKED' | null
 * @param {string} [options.demoModule]     - security lab module name
 * @param {string} [options.message]
 * @param {Object} [options.meta]           - additional metadata (will be redacted)
 * @param {string} [options.userId]
 * @param {string} [options.ip]
 */
function logEvent(options = {}) {
  try {
    const {
      requestId = uuidv4(),
      endpoint = '',
      method = '',
      eventCategory = 'SYSTEM',
      statusCode = null,
      responseTime = null,
      severity = 'INFO',
      detectionResult = null,
      demoModule = null,
      message = '',
      meta = null,
      userId = null,
      ip = null,
    } = options;

    const entry = {
      timestamp: new Date().toISOString(),
      requestId,
      endpoint: redactString(endpoint),
      method: method.toUpperCase() || '',
      eventCategory,
      statusCode,
      responseTime,
      severity,
      detectionResult,
      demoModule,
      message: redactString(message),
      userId,
      ip,
      meta: meta ? redactSensitive(meta) : undefined,
    };

    // Remove undefined keys to keep log lines clean
    const cleanEntry = Object.fromEntries(
      Object.entries(entry).filter(([, v]) => v !== undefined && v !== null || typeof v === 'number')
    );

    const line = JSON.stringify(cleanEntry) + '\n';

    for (const logPath of LOG_FILES) {
      try {
        fs.appendFileSync(logPath, line, 'utf8');
      } catch (err) {
        // Fallback or ignore
      }
    }

    // Also mirror ERROR/WARN to console
    if (severity === 'ERROR') {
      console.error(`[${severity}] ${eventCategory} ${message}`);
    } else if (severity === 'WARN' && process.env.NODE_ENV !== 'test') {
      console.warn(`[${severity}] ${eventCategory} ${message}`);
    }
  } catch (loggingError) {
    // Never crash the app due to logging failures
    console.error('[Logger] Unexpected logging error:', loggingError.message);
  }
}

// ─── Express Request Logger Middleware ──────────────────────────────────────
/**
 * Middleware that assigns a requestId to every request and logs
 * each request/response pair as a JSONL entry.
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || uuidv4();

  // Attach requestId so route handlers can reference it
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const originalEnd = res.end.bind(res);

  res.end = function (chunk, encoding, callback) {
    const responseTime = Date.now() - startTime;

    // Determine category from path
    let eventCategory = 'HTTP';
    const urlPath = req.path || '';
    if (urlPath.startsWith('/api/auth')) eventCategory = 'AUTH';
    else if (urlPath.startsWith('/api/products')) eventCategory = 'PRODUCT';
    else if (urlPath.startsWith('/api/cart')) eventCategory = 'CART';
    else if (urlPath.startsWith('/api/orders')) eventCategory = 'ORDER';
    else if (urlPath.startsWith('/api/wishlist')) eventCategory = 'WISHLIST';
    else if (urlPath.startsWith('/api/reviews')) eventCategory = 'REVIEW';

    const statusCode = res.statusCode;
    let severity = 'INFO';
    if (statusCode >= 500) severity = 'ERROR';
    else if (statusCode >= 400) severity = 'WARN';

    // Capture a safe subset of the request body (never log passwords)
    let safeMeta = undefined;
    if (req.body && typeof req.body === 'object') {
      const bodyKeys = Object.keys(req.body);
      if (bodyKeys.length > 0) {
        safeMeta = redactSensitive({ body_keys: bodyKeys });
      }
    }

    logEvent({
      requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory,
      statusCode,
      responseTime,
      severity,
      detectionResult: res.locals.detectionResult || null,
      demoModule: res.locals.demoModule || null,
      message: `${req.method} ${req.originalUrl} ${statusCode} ${responseTime}ms`,
      userId: req.user ? req.user.id : null,
      ip: req.ip || req.connection.remoteAddress,
      meta: safeMeta,
    });

    return originalEnd(chunk, encoding, callback);
  };

  next();
}

module.exports = {
  logEvent,
  requestLogger,
  redactSensitive,
};
