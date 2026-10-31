'use strict';

const { Pool } = require('pg');

// ─── Pool Configuration ──────────────────────────────────────────────────────
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'nova_ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

// ─── Pool Event Handlers ─────────────────────────────────────────────────────
pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[DB] New client connected. Pool size: ${pool.totalCount}`);
  }
});

pool.on('error', (err, client) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  // Don't crash the server; the pool will recover
});

pool.on('remove', (client) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[DB] Client removed. Remaining pool size: ${pool.totalCount}`);
  }
});

// ─── Query Helper ────────────────────────────────────────────────────────────
/**
 * Execute a parameterized query against the PostgreSQL pool.
 * @param {string} text - SQL query string with $1, $2 placeholders
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development' && process.env.DB_LOG_QUERIES === 'true') {
      console.log('[DB Query]', {
        text: text.substring(0, 120),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (err) {
    const duration = Date.now() - start;
    console.error('[DB Error]', {
      text: text.substring(0, 120),
      duration: `${duration}ms`,
      error: err.message,
      code: err.code,
    });
    throw err;
  }
}

// ─── Transaction Helper ──────────────────────────────────────────────────────
/**
 * Execute a function inside a database transaction.
 * Automatically rolls back on error.
 * @param {Function} fn - Async function receiving a query function scoped to the transaction client
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transactionQuery = (text, params) => client.query(text, params);
    const result = await fn(transactionQuery, client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Test Connection ─────────────────────────────────────────────────────────
/**
 * Verify the database connection is alive.
 * Resolves on success, rejects with error on failure.
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS now, current_database() AS db');
    const { now, db } = result.rows[0];
    console.log(`[DB] Connection OK — database: "${db}", server time: ${now}`);
    return { now, db };
  } finally {
    client.release();
  }
}

// ─── Pool Stats ──────────────────────────────────────────────────────────────
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  getPoolStats,
};
