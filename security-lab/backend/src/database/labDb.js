/**
 * NOVA Security Lab — Lab Database Connection Pools
 *
 * TWO pools are created deliberately:
 *
 *   adminPool    — Uses admin credentials.  Used by the XSS module to INSERT
 *                  demo reviews into demo_reviews.  Has write access.
 *
 *   readonlyPool — Uses the demo_readonly role.  Used by the SQL Injection module
 *                  to perform SELECT queries (both the vulnerable and secure
 *                  endpoints run under this restricted role to limit blast radius).
 *
 * Connection details are read from environment variables (see .env.example).
 */

'use strict';

const { Pool } = require('pg');

// ─── Shared base config ───────────────────────────────────────────────────────
const baseConfig = {
  host:            process.env.LAB_DB_HOST     ?? '127.0.0.1',
  port:            parseInt(process.env.LAB_DB_PORT ?? '5432', 10),
  database:        process.env.LAB_DB_NAME     ?? 'nova_lab',
  // Conservative pool sizes — this is a lab, not production
  max:             5,
  idleTimeoutMillis:    30_000,
  connectionTimeoutMillis: 5_000,
};

// ─── Admin pool (write access for XSS demo) ───────────────────────────────────
const adminPool = new Pool({
  ...baseConfig,
  user:     process.env.LAB_DB_ADMIN_USER     ?? 'nova_lab_admin',
  password: process.env.LAB_DB_ADMIN_PASSWORD ?? 'changeme_admin',
});

adminPool.on('error', (err) => {
  console.error('[labDb:adminPool] Unexpected client error:', err.message);
});

// ─── Read-only pool (for SQL Injection demo) ──────────────────────────────────
const readonlyPool = new Pool({
  ...baseConfig,
  user:     process.env.LAB_DB_READONLY_USER     ?? 'demo_readonly',
  password: process.env.LAB_DB_READONLY_PASSWORD ?? 'changeme_readonly',
});

readonlyPool.on('error', (err) => {
  console.error('[labDb:readonlyPool] Unexpected client error:', err.message);
});

// ─── Graceful shutdown helper ─────────────────────────────────────────────────
async function closeAll() {
  await Promise.all([adminPool.end(), readonlyPool.end()]);
}

module.exports = { adminPool, readonlyPool, closeAll };
