/**
 * NOVA Security Lab — JSONL Event Logger
 *
 * Writes one JSON object per line to ../../logs/app.log.jsonl
 * (relative to this file: security-lab/backend/src/ → logs/ at project root)
 *
 * PRIVACY RULES:
 *   - Raw payloads are NEVER logged.
 *   - Payloads are always hashed with SHA-256 before being stored.
 *   - Log files should be treated as sensitive and not committed to VCS.
 *
 * Lab-specific fields appended to every structured log entry:
 *   demoModule      — "sqli" | "xss" | "ddos" | "server"
 *   attackType      — specific sub-type of attack being demonstrated
 *   payloadHash     — SHA-256 hex of the raw payload (never the payload itself)
 *   detectionResult — "detected" | "bypassed" | "blocked" | "n/a"
 *   severity        — "low" | "medium" | "high" | "critical"
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

// Resolve log file path: src/ → backend/ → security-lab/ → nova-ecommerce/ → logs/
const LOG_DIR  = path.resolve(__dirname, '..', '..', '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log.jsonl');

// Ensure the log directory exists (sync, once at module load)
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error(`[labLogger] Cannot create log directory at ${LOG_DIR}:`, err.message);
}

// ─── SHA-256 payload hash ─────────────────────────────────────────────────────
/**
 * Returns the SHA-256 hex digest of a given string.
 * Use this instead of logging raw user input.
 *
 * @param {string} payload - Raw user-supplied data.
 * @returns {string} 64-character hex string.
 */
function hashPayload(payload) {
  if (payload === undefined || payload === null) return 'null';
  return crypto.createHash('sha256').update(String(payload)).digest('hex');
}

// ─── Core write function ──────────────────────────────────────────────────────
/**
 * Writes a single JSONL log entry to disk.
 *
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {object} fields - Arbitrary structured fields.
 */
function write(level, fields) {
  const entry = {
    timestamp:       new Date().toISOString(),
    level,
    // Merge caller-supplied fields but strip any accidentally included "payload" key
    ...fields,
    // Always ensure payloadHash is present; hash the payload if the caller forgot
    payloadHash: fields.payloadHash
      ?? (fields.payload ? hashPayload(fields.payload) : undefined),
    // Remove raw payload from the final entry for safety
    payload: undefined,
  };

  // Remove keys with undefined values to keep the JSONL tidy
  const clean = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined)
  );

  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(clean) + '\n', 'utf8');
  } catch (err) {
    // Last-resort console output if file write fails
    console.error('[labLogger] Failed to write log entry:', err.message);
    console.error('[labLogger] Entry was:', JSON.stringify(clean));
  }

  // Also mirror to stdout for developer convenience
  console.log(`[NOVA-LAB][${level.toUpperCase()}]`, JSON.stringify(clean));
}

// ─── Public API ───────────────────────────────────────────────────────────────
const labLogger = {
  /**
   * Hash a payload string before logging. Exposed so route handlers
   * can compute the hash once and pass it in.
   */
  hashPayload,

  debug: (fields) => write('debug', fields),
  info:  (fields) => write('info',  fields),
  warn:  (fields) => write('warn',  fields),
  error: (fields) => write('error', fields),

  /**
   * Log a lab security event.
   *
   * @param {object} opts
   * @param {'sqli'|'xss'|'ddos'|'server'} opts.demoModule
   * @param {string}  opts.attackType        - e.g. "sqli_union", "xss_stored"
   * @param {string}  opts.payloadHash       - SHA-256 of raw input (use hashPayload())
   * @param {'detected'|'bypassed'|'blocked'|'n/a'} opts.detectionResult
   * @param {'low'|'medium'|'high'|'critical'} opts.severity
   * @param {string}  [opts.endpoint]        - Route that handled the request
   * @param {string}  [opts.ip]              - Requester IP
   * @param {object}  [opts.extra]           - Any additional structured context
   */
  logLabEvent: ({
    demoModule,
    attackType,
    payloadHash,
    detectionResult,
    severity,
    endpoint = '',
    ip = '',
    extra = {},
  }) => {
    write('info', {
      event: 'lab_event',
      demoModule,
      attackType,
      payloadHash,
      detectionResult,
      severity,
      endpoint,
      ip,
      ...extra,
    });
  },
};

module.exports = labLogger;
