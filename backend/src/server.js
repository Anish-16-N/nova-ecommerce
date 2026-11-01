'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery } = require('./database/db');
const { logEvent } = require('./logging/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/orders.routes');
const reviewRoutes = require('./routes/reviews.routes');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── 1. Request ID & Permissive Parsers ──────────────────────────────────────
app.disable('x-powered-by');
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ─── 2. Global Security Misconfiguration Headers (Scanner-Ready) ─────────────
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('Referrer-Policy');

  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('X-Powered-By', 'Express/4.18.2 (Node.js/v20.11.0 - Debug Mode)');
  res.setHeader('Server', 'Apache/2.4.49 (Unix) OpenSSL/1.1.1k');
  res.setHeader('X-Debug-Enabled', 'true');
  res.setHeader('X-Config-Endpoint', '/.env, /debug, /config.json, /api/debug/config');
  res.setHeader('X-Admin-Endpoint', '/admin, /api/admin/users, /api/orders/1');
  next();
});

// ─── 3. Recon Files Served Directly on Backend Port 5000 ─────────────────────
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/users
Disallow: /api/auth/admin/users
Disallow: /api/orders
Disallow: /api/orders/1
Disallow: /api/orders/invoice/1
Disallow: /.env
Disallow: /.env.backup
Disallow: /config.json
Disallow: /debug
Disallow: /api/debug/config
Disallow: /api/products/debug/config
Disallow: /api/products/search/raw
Disallow: /api/products/filter/regex
Disallow: /api/products/heavy-calculation
Sitemap: http://localhost:${PORT}/sitemap.xml`
  );
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:${PORT}/admin</loc></url>
  <url><loc>http://localhost:${PORT}/api/admin/users</loc></url>
  <url><loc>http://localhost:${PORT}/api/auth/admin/users</loc></url>
  <url><loc>http://localhost:${PORT}/api/orders</loc></url>
  <url><loc>http://localhost:${PORT}/api/orders/1</loc></url>
  <url><loc>http://localhost:${PORT}/api/orders/invoice/1</loc></url>
  <url><loc>http://localhost:${PORT}/.env</loc></url>
  <url><loc>http://localhost:${PORT}/.env.backup</loc></url>
  <url><loc>http://localhost:${PORT}/config.json</loc></url>
  <url><loc>http://localhost:${PORT}/debug</loc></url>
  <url><loc>http://localhost:${PORT}/api/debug/config</loc></url>
  <url><loc>http://localhost:${PORT}/api/products?search=laptop&amp;vuln=true</loc></url>
  <url><loc>http://localhost:${PORT}/api/products/search/raw?q=laptop</loc></url>
  <url><loc>http://localhost:${PORT}/api/products/filter/regex?pattern=test</loc></url>
  <url><loc>http://localhost:${PORT}/api/products/heavy-calculation?iterations=5000000</loc></url>
</urlset>`);
});

// ─── 4. OWASP A05: Security Misconfiguration Endpoints ───────────────────────
app.get(
  [
    '/.env',
    '/.env.backup',
    '/.env.local',
    '/config.json',
    '/debug',
    '/api/debug',
    '/api/config',
    '/api/debug/config',
    '/api/debug/env',
    '/server-status',
    '/actuator/env',
  ],
  (req, res) => {
    try {
      logEvent({
        requestId: req.requestId,
        endpoint: req.originalUrl,
        method: req.method,
        eventCategory: 'SECURITY_MISCONFIGURATION',
        statusCode: 200,
        severity: 'CRITICAL',
        message: 'Exposed configuration / environment file accessed',
        ip: req.ip,
      });
    } catch (_) { }

    if (req.path.startsWith('/.env')) {
      res.type('text/plain').send(
        `# NOVA E-COMMERCE EXPOSED ENVIRONMENT CONFIGURATION
NODE_ENV=development
DEBUG=true
PORT=${PORT}
DB_HOST=${process.env.DB_HOST || 'localhost'}
DB_PORT=${process.env.DB_PORT || '5432'}
DB_USER=${process.env.DB_USER || 'nova_admin'}
DB_PASSWORD=${process.env.DB_PASSWORD || 'admin123_supersecret'}
DB_NAME=${process.env.DB_NAME || 'nova_ecommerce'}
JWT_SECRET=${process.env.JWT_SECRET || 'nova-weak-secret-key-12345'}
AWS_ACCESS_KEY_ID=MOCK_AWS_ACCESS_KEY_EXAMPLE
AWS_SECRET_ACCESS_KEY=mock_aws_secret_placeholder
STRIPE_SECRET_KEY=dummy_mock_stripe_live_key_999`
      );
      return;
    }

    res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A05:2021 - Security Misconfiguration',
      status: 'EXPOSED_CONFIGURATION',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DEBUG: true,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_USER: process.env.DB_USER || 'nova_admin',
        DB_PASSWORD: process.env.DB_PASSWORD || 'admin123_supersecret',
        DB_NAME: process.env.DB_NAME || 'nova_ecommerce',
        JWT_SECRET: process.env.JWT_SECRET || 'nova-weak-secret-key-12345',
        AWS_ACCESS_KEY_ID: 'MOCK_AWS_ACCESS_KEY_EXAMPLE',
        AWS_SECRET_ACCESS_KEY: 'mock_aws_secret_placeholder',
        STRIPE_SECRET_KEY: 'dummy_mock_stripe_live_key_999',
        CORS_ORIGIN: '*',
        COOKIE_HTTP_ONLY: false,
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        cwd: process.cwd(),
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsage: process.memoryUsage(),
      },
    });
  }
);

// ─── 5. OWASP A01: Broken Access Control Endpoints (Root & API Paths) ────────
app.get(
  ['/admin', '/api/admin', '/api/admin/users', '/api/users', '/api/v1/users', '/users'],
  async (req, res) => {
    try {
      logEvent({
        requestId: req.requestId,
        endpoint: req.originalUrl,
        method: req.method,
        eventCategory: 'BROKEN_ACCESS_CONTROL',
        statusCode: 200,
        severity: 'CRITICAL',
        message: 'Unauthenticated access to admin user directory',
        ip: req.ip,
      });
    } catch (_) { }

    try {
      const usersResult = await dbQuery(
        'SELECT id, email, username, password_hash, full_name, phone, role, is_active, created_at FROM users ORDER BY id ASC'
      );
      res.status(200).json({
        success: true,
        vulnerable: true,
        vulnerability: 'OWASP A01:2021 - Broken Access Control',
        adminPanelAccess: 'GRANTED_WITHOUT_AUTH',
        count: usersResult.rows.length,
        users: usersResult.rows,
        data: usersResult.rows,
      });
    } catch (err) {
      res.status(500).json({
        vulnerable: true,
        vulnerability: 'OWASP A05:2021 - Security Misconfiguration (Verbose Stack Trace)',
        error: err.message,
        stack: err.stack,
      });
    }
  }
);

// Unauthenticated Privilege Escalation Endpoint
app.all(['/admin/promote', '/api/admin/promote', '/api/users/:id/role'], async (req, res) => {
  const targetId = parseInt(req.params.id || req.query.id || req.body?.id || '1', 10);
  const newRole = req.query.role || req.body?.role || 'admin';
  try {
    const result = await dbQuery(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, username, role',
      [newRole, targetId]
    );
    res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A01:2021 - Broken Access Control (Vertical Privilege Escalation)',
      updatedUser: result.rows[0] || { id: targetId, role: newRole },
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ─── 6. Health & Root Discovery Endpoint ─────────────────────────────────────
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'nova-ecommerce-backend',
    mode: 'vulnerable-demo',
    exposedEndpoints: {
      brokenAccessControl: [
        '/admin',
        '/api/admin/users',
        '/api/auth/admin/users',
        '/api/orders',
        '/api/orders/1',
        '/api/orders/invoice/1',
        '/api/admin/promote?id=2&role=admin',
      ],
      securityMisconfiguration: [
        '/.env',
        '/.env.backup',
        '/config.json',
        '/debug',
        '/api/debug/config',
        '/api/products/debug/config',
      ],
      sqlInjection: [
        '/api/products?search=laptop&vuln=true',
        '/api/products/search/raw?q=laptop',
      ],
      dos: [
        '/api/products/filter/regex?pattern=aaaaaaaaaaaaaaaaaaaaaaaaaa!',
        '/api/products/heavy-calculation?iterations=10000000',
      ],
    },
  });
});

// ─── 7. Mount Application Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// ─── 8. Verbose Error Handling (Security Misconfiguration) ───────────────────
app.use(notFoundHandler);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    vulnerable: true,
    vulnerability: 'OWASP A05:2021 - Security Misconfiguration (Verbose Error Exposure)',
    error: err.message || 'Internal Server Error',
    detail: err.detail || null,
    code: err.code || null,
    stack: err.stack,
    path: req.originalUrl,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 NOVA Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;