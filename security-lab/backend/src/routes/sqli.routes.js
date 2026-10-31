/**
 * NOVA Security Lab — SQL Injection Demo Routes
 *
 * ============================================================
 * ⚠️  INTENTIONALLY VULNERABLE — SQL INJECTION DEMO ONLY
 * ⚠️  This code is DELIBERATELY unsafe for demonstration.
 * ⚠️  DO NOT use this pattern in production.
 * ⚠️  This endpoint is restricted to the local security lab.
 * ============================================================
 *
 * Routes:
 *   POST /lab/sqli/vulnerable-login   — String-concatenation login (VULNERABLE)
 *   POST /lab/sqli/secure-login       — Parameterized login (SECURE)
 *   GET  /lab/sqli/vulnerable-search  — String-concatenation search (VULNERABLE)
 *   GET  /lab/sqli/secure-search      — Parameterized search (SECURE)
 *   GET  /lab/sqli/data               — Returns demo dataset overview
 *
 * All queries run under the `demo_readonly` PostgreSQL role to limit
 * blast radius even on the intentionally vulnerable endpoints.
 */

'use strict';

const express   = require('express');
const router    = express.Router();
const labLogger = require('../labLogger');
const { readonlyPool } = require('../database/labDb');

// ─── Helper: classify whether a payload looks like an injection attempt ───────
/**
 * Very simple heuristic — used ONLY to label the log entry's detectionResult.
 * It is NOT used as a security control; the vulnerable endpoints are deliberately
 * unprotected to show the attack working.
 *
 * @param {string} input
 * @returns {'detected'|'n/a'}
 */
function detectInjectionHeuristic(input) {
  if (typeof input !== 'string') return 'n/a';
  const lower = input.toLowerCase();
  const patterns = [
    /'\s*(or|and)\s*'/i,
    /--/,
    /;/,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /xp_cmdshell/i,
    /'\s*=\s*'/,
    /1\s*=\s*1/,
    /\/\*.*\*\//,
  ];
  return patterns.some((p) => p.test(lower)) ? 'detected' : 'n/a';
}

// ─── Helper: safe string truncation for log metadata ─────────────────────────
function truncate(str, max = 80) {
  if (typeof str !== 'string') return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// =============================================================================
// POST /lab/sqli/vulnerable-login
// =============================================================================
// ⚠️  VULNERABLE: username and password are concatenated directly into SQL.
//     An attacker can bypass authentication with: username = ' OR '1'='1
// =============================================================================
router.post('/vulnerable-login', async (req, res) => {
  const { username = '', password = '' } = req.body ?? {};
  const payloadHash = labLogger.hashPayload(`${username}:${password}`);
  const detection   = detectInjectionHeuristic(username) === 'detected'
    ? 'detected'
    : detectInjectionHeuristic(password);

  labLogger.logLabEvent({
    demoModule:      'sqli',
    attackType:      'sqli_authentication_bypass',
    payloadHash,
    detectionResult: detection,
    severity:        'critical',
    endpoint:        'POST /lab/sqli/vulnerable-login',
    ip:              req.ip,
  });

  // ========================================================
  // ⚠️  INTENTIONALLY VULNERABLE — SQL INJECTION DEMO ONLY
  // ⚠️  This SQL is built by string concatenation.
  // ⚠️  DO NOT use this pattern in production.
  // ========================================================
  const sql =
    "SELECT id, username, email FROM demo_customers " +
    "WHERE username = '" + username + "' AND password_hash = '" + password + "'";

  let client;
  try {
    client = await readonlyPool.connect();

    // Log the constructed SQL for the lab UI (educational — never do this in prod)
    const result = await client.query(sql);

    if (result.rows.length > 0) {
      return res.json({
        success:        true,
        bypassed:       true,
        message:        'Login successful',
        query:          sql,
        rows:           result.rows,
        rowCount:       result.rows.length,
        users:          result.rows,
        lab: {
          mode:         'vulnerable',
          sqlExecuted:  sql,
          injectionNote: detection === 'detected'
            ? '⚠️ Injection pattern detected in payload — the vulnerable endpoint executed it anyway.'
            : 'No obvious injection pattern detected.',
        },
      });
    } else {
      return res.status(401).json({
        success:  false,
        bypassed: false,
        message:  'Invalid credentials',
        query:    sql,
        rows:     [],
        rowCount: 0,
        lab: {
          mode:        'vulnerable',
          sqlExecuted: sql,
        },
      });
    }
  } catch (err) {
    labLogger.error({
      event:     'sqli_vulnerable_login_error',
      errorType: err.code ?? 'unknown',
      message:   err.message,
      ip:        req.ip,
    });
    return res.status(500).json({
      success:   false,
      bypassed:  false,
      message:   'Database error',
      error:     err.message,
      dbError:   err.message,
      query:     sql,
      rows:      [],
      lab: {
        mode:        'vulnerable',
        sqlExecuted: sql,
        note:        '⚠️  Error details exposed — this is intentional for the SQLi demo.',
      },
    });
  } finally {
    client?.release();
  }
});

// =============================================================================
// POST /lab/sqli/secure-login
// =============================================================================
// ✅  SECURE: Uses a parameterized query ($1, $2).
//     The database driver handles escaping; SQL structure cannot be altered.
// =============================================================================
router.post('/secure-login', async (req, res) => {
  const { username = '', password = '' } = req.body ?? {};
  const payloadHash = labLogger.hashPayload(`${username}:${password}`);
  const detection   = detectInjectionHeuristic(username) === 'detected'
    ? 'detected'
    : detectInjectionHeuristic(password);

  labLogger.logLabEvent({
    demoModule:      'sqli',
    attackType:      'sqli_authentication_bypass',
    payloadHash,
    detectionResult: detection === 'detected' ? 'blocked' : 'n/a',
    severity:        'critical',
    endpoint:        'POST /lab/sqli/secure-login',
    ip:              req.ip,
    extra:           { secureMode: true },
  });

  // ✅  SECURE: Parameterized query — user input never touches SQL structure
  const sql    = 'SELECT id, username, email FROM demo_customers WHERE username = $1 AND password_hash = $2';
  const params = [username, password];

  let client;
  try {
    client = await readonlyPool.connect();
    const result = await client.query(sql, params);

    if (result.rows.length > 0) {
      return res.json({
        success:  true,
        bypassed: false,
        message:  'Login successful',
        query:    sql + ` -- params: [${params.map(p => JSON.stringify(p)).join(', ')}]`,
        rows:     result.rows,
        rowCount: result.rows.length,
        users:    result.rows,
        lab: {
          mode:        'secure',
          sqlTemplate: sql,
          note:        '✅ Parameterized query — injection payload treated as literal data, not SQL.',
          injectionNote: detection === 'detected'
            ? '✅ Injection pattern found in payload — but it was safely parameterized and had no effect.'
            : 'No injection pattern detected.',
        },
      });
    } else {
      return res.status(401).json({
        success:  false,
        bypassed: false,
        message:  'Invalid credentials',
        query:    sql + ` -- params: [${params.map(p => JSON.stringify(p)).join(', ')}]`,
        rows:     [],
        rowCount: 0,
        lab: {
          mode:        'secure',
          sqlTemplate: sql,
          note:        '✅ Parameterized query used.',
        },
      });
    }
  } catch (err) {
    labLogger.error({
      event:   'sqli_secure_login_error',
      message: err.message,
      ip:      req.ip,
    });
    return res.status(500).json({
      success: false,
      bypassed: false,
      message: 'Database error — check server logs.',
      error:   err.message,
      query:   sql,
      rows:    [],
      lab:     { mode: 'secure' },
    });
  } finally {
    client?.release();
  }
});

// =============================================================================
// GET /lab/sqli/vulnerable-search?q=...
// =============================================================================
// ⚠️  VULNERABLE: Query param `q` is concatenated directly into SQL.
//     An attacker can perform UNION-based injection to exfiltrate data.
// =============================================================================
router.get('/vulnerable-search', async (req, res) => {
  const q           = req.query.q ?? '';
  const payloadHash = labLogger.hashPayload(q);
  const detection   = detectInjectionHeuristic(q);

  labLogger.logLabEvent({
    demoModule:      'sqli',
    attackType:      'sqli_union_search',
    payloadHash,
    detectionResult: detection,
    severity:        'high',
    endpoint:        'GET /lab/sqli/vulnerable-search',
    ip:              req.ip,
  });

  // ========================================================
  // ⚠️  INTENTIONALLY VULNERABLE — SQL INJECTION DEMO ONLY
  // ⚠️  String concatenation in SQL WHERE clause.
  // ========================================================
  const sql =
    "SELECT id, name, price, category FROM demo_products " +
    "WHERE name ILIKE '%" + q + "%'";

  let client;
  try {
    client = await readonlyPool.connect();
    const result = await client.query(sql);

    return res.json({
      success:  true,
      query:    sql,
      rows:     result.rows,
      rowCount: result.rows.length,
      products: result.rows,
      lab: {
        mode:        'vulnerable',
        sqlExecuted: sql,
        injectionNote: detection === 'detected'
          ? '⚠️  Injection pattern detected — the vulnerable endpoint executed it anyway.'
          : 'Try: %) UNION SELECT id, username, email, password_hash FROM demo_customers--',
      },
    });
  } catch (err) {
    labLogger.error({
      event:   'sqli_vulnerable_search_error',
      message: err.message,
      ip:      req.ip,
    });
    return res.status(500).json({
      success:  false,
      message:  'Database error',
      error:    err.message,
      dbError:  err.message, // Intentionally exposed in vulnerable endpoint
      query:    sql,
      rows:     [],
      lab: {
        mode:        'vulnerable',
        sqlExecuted: sql,
        note:        '⚠️  Error details exposed — intentional for error-based SQLi demo.',
      },
    });
  } finally {
    client?.release();
  }
});

// =============================================================================
// GET /lab/sqli/secure-search?q=...
// =============================================================================
// ✅  SECURE: Uses parameterized ILIKE with $1 placeholder.
// =============================================================================
router.get('/secure-search', async (req, res) => {
  const q           = req.query.q ?? '';
  const payloadHash = labLogger.hashPayload(q);
  const detection   = detectInjectionHeuristic(q);

  labLogger.logLabEvent({
    demoModule:      'sqli',
    attackType:      'sqli_union_search',
    payloadHash,
    detectionResult: detection === 'detected' ? 'blocked' : 'n/a',
    severity:        'high',
    endpoint:        'GET /lab/sqli/secure-search',
    ip:              req.ip,
    extra:           { secureMode: true },
  });

  // ✅  SECURE: Parameterized ILIKE — % wildcards are added server-side,
  //     not by the user, so they cannot break out of the string literal.
  const sql    = 'SELECT id, name, price, category FROM demo_products WHERE name ILIKE $1';
  const params = [`%${q}%`];

  let client;
  try {
    client = await readonlyPool.connect();
    const result = await client.query(sql, params);

    return res.json({
      success:  true,
      query:    sql + ` -- params: [${params.map(p => JSON.stringify(p)).join(', ')}]`,
      rows:     result.rows,
      rowCount: result.rows.length,
      products: result.rows,
      lab: {
        mode:        'secure',
        sqlTemplate: sql,
        note:        '✅ Parameterized ILIKE — injection payload is treated as a literal search string.',
        injectionNote: detection === 'detected'
          ? '✅ Injection pattern found, but safely parameterized — no effect.'
          : 'No injection pattern detected.',
      },
    });
  } catch (err) {
    labLogger.error({
      event:   'sqli_secure_search_error',
      message: err.message,
      ip:      req.ip,
    });
    return res.status(500).json({
      success: false,
      message: 'Database error — check server logs.',
      error:   err.message,
      query:   sql,
      rows:    [],
      lab:     { mode: 'secure' },
    });
  } finally {
    client?.release();
  }
});

// =============================================================================
// GET /lab/sqli/data
// =============================================================================
// Returns the demo dataset so the lab UI can display what's in the database.
// =============================================================================
router.get('/data', async (req, res) => {
  let client;
  try {
    client = await readonlyPool.connect();

    const [customers, products] = await Promise.all([
      client.query('SELECT id, username, email FROM demo_customers ORDER BY id'),
      client.query('SELECT id, name, price, category FROM demo_products ORDER BY id'),
    ]);

    return res.json({
      success: true,
      data: {
        customers: customers.rows,
        products:  products.rows,
      },
      lab: {
        note: 'This is the demo database the SQL Injection lab operates on.',
        tables: ['demo_customers (id, username, email, password_hash)', 'demo_products (id, name, price, category)'],
      },
    });
  } catch (err) {
    labLogger.error({ event: 'sqli_data_error', message: err.message });
    return res.status(500).json({ success: false, message: 'Database error — check server logs.' });
  } finally {
    client?.release();
  }
});

module.exports = router;
