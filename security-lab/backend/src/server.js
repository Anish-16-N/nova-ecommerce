/**
 * NOVA Security Lab — Isolated Express Server
 *
 * PORT: 5001  (binds ONLY to 127.0.0.1)
 * PURPOSE: Demonstrate SQL Injection, XSS, and DoS/DDoS in a controlled lab.
 *
 * SAFETY GUARDS:
 *   1. Refuses to start unless ENABLE_DEMO_LAB=true
 *   2. Refuses to start in NODE_ENV=production
 *   3. Binds exclusively to localhost (127.0.0.1) — never 0.0.0.0
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const labLogger = require('./labLogger');

// ─── Safety guard: production environment ─────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  console.error(
    '[NOVA-LAB] FATAL: The Security Lab server MUST NOT run in production. ' +
    'Set NODE_ENV to "development" or "test" and try again.'
  );
  process.exit(1);
}

// ─── Safety guard: lab toggle ─────────────────────────────────────────────────
if (process.env.ENABLE_DEMO_LAB !== 'true') {
  console.error(
    '[NOVA-LAB] FATAL: Set ENABLE_DEMO_LAB=true in your .env to start the lab.'
  );
  process.exit(1);
}

// ─── App setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.LAB_PORT ?? '5001', 10);
const HOST = '127.0.0.1'; // NEVER change to 0.0.0.0

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// Restrict CORS to localhost origins only
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (same-origin, Postman, curl) and
      // any localhost / 127.0.0.1 origin.
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error(`[NOVA-LAB] CORS: origin "${origin}" is not allowed.`));
    },
    credentials: true,
  })
);

// ─── Request audit middleware ─────────────────────────────────────────────────
app.use((req, _res, next) => {
  labLogger.info({
    event:      'request',
    method:     req.method,
    path:       req.path,
    ip:         req.ip,
    userAgent:  req.headers['user-agent'] ?? '',
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const sqliRoutes  = require('./routes/sqli.routes');
const xssRoutes   = require('./routes/xss.routes');
const ddosRoutes  = require('./routes/ddos.routes');

app.use('/lab/sqli', sqliRoutes);
app.use('/lab/xss',  xssRoutes);
app.use('/lab/ddos', ddosRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/lab/health', (_req, res) => {
  res.json({
    status:    'ok',
    lab:       'NOVA Security Lab',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    modules:   ['sqli', 'xss', 'ddos'],
    warning:   'This server contains INTENTIONALLY VULNERABLE endpoints for educational purposes only.',
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Lab route not found', path: req.path });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  labLogger.error({
    event:   'unhandled_error',
    message: err.message,
    path:    req.path,
    method:  req.method,
  });
  res.status(500).json({ error: 'Internal lab server error', message: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
let server;

if (require.main === module) {
  server = app.listen(PORT, HOST, () => {
    console.log(`[NOVA-LAB] ✅  Security Lab running at http://${HOST}:${PORT}`);
    console.log(`[NOVA-LAB] ⚠️   This server contains DELIBERATELY VULNERABLE endpoints.`);
    console.log(`[NOVA-LAB] ⚠️   For educational use only. DO NOT expose to public networks.`);
    labLogger.info({ event: 'server_start', host: HOST, port: PORT });
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`[NOVA-LAB] ${signal} received — shutting down gracefully.`);
    labLogger.info({ event: 'server_stop', signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

module.exports = app; // Export for Supertest
