'use strict';

require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./database/db');
const { requestLogger } = require('./logging/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const orderRoutes = require('./routes/orders.routes');
const reviewRoutes = require('./routes/reviews.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  xXssProtection: false,
}));

// ─── Leaky Recon & Information Disclosure Headers (For Hackathon Security Scanners) ───
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express/4.18-Vulnerable-Demo');
  res.setHeader('X-Backend-DB', 'PostgreSQL-Raw-Query-Mode');
  res.setHeader('X-Recon-Hint', 'Check /robots.txt, /sitemap.xml, and /api/debug/env');
  next();
});

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Request-ID'],
}));

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Request Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── JSONL Custom Request Logger ────────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const isConnected = await testConnection();
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NOVA Backend API',
    version: '1.0.0',
    database: isConnected ? 'postgresql' : 'in-memory-fallback',
  });
});

// ─── Robots.txt & Sitemap.xml for Automated Security Scanners ───────────────
const ROBOTS_PATH = path.resolve(__dirname, '../../frontend/public/robots.txt');
const SITEMAP_PATH = path.resolve(__dirname, '../../frontend/public/sitemap.xml');

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  if (fs.existsSync(ROBOTS_PATH)) {
    return res.sendFile(ROBOTS_PATH);
  }
  res.send('User-agent: *\nDisallow: /api/\nSitemap: http://localhost:5173/sitemap.xml');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  if (fs.existsSync(SITEMAP_PATH)) {
    return res.sendFile(SITEMAP_PATH);
  }
  res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
});

// ─── Reconnaissance & Information Disclosure Endpoints ─────────────────────────
const DUMMY_ENV_BACKUP = `# ========================================================
# ⚠️ EXPOSED SYNTHETIC ENVIRONMENT CONFIGURATION (.env.backup)
# ⚠️ INTENTIONAL INFORMATION DISCLOSURE FOR DEMO
# ========================================================
NODE_ENV=development
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=nova_db
DB_USER=nova_admin
DB_PASSWORD=dummy_exposed_pass
JWT_SECRET=weak-demo-secret-123
JWT_EXPIRES_IN=7d
STRIPE_TEST_KEY=sk_test_dummy_51N_exposed_hackathon_demo_key
INTERNAL_ADMIN_GATEWAY=http://127.0.0.1:5000/api/auth/users/debug
SECURITY_LAB_URL=http://127.0.0.1:5001/lab
`;

app.get(['/.env.backup', '/api/debug/env'], (_req, res) => {
  res.type('text/plain').send(DUMMY_ENV_BACKUP);
});

// OpenAPI 3.0 specification for automated security scanners & fuzzers
const SWAGGER_DOC = {
  openapi: '3.0.0',
  info: {
    title: 'NOVA E-Commerce & Security Lab API',
    version: '1.0.0',
    description: 'Auto-discoverable API catalog for security reconnaissance and penetration testing.',
  },
  paths: {
    '/api/products/search/raw': {
      get: {
        summary: 'Raw Unescaped SQL Search (SQL Injection)',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search keyword (SQL Injection sink)' }],
        responses: { 200: { description: 'Search results' } },
      },
    },
    '/api/products': {
      get: {
        summary: 'Product Catalog Search & Filter',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'vuln', in: 'query', schema: { type: 'string' }, description: "Set to 'true' for raw SQL interpolation" },
          { name: 'sort_raw', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Products list' } },
      },
    },
    '/api/products/filter/regex': {
      get: {
        summary: 'ReDoS Regex Evaluation',
        parameters: [{ name: 'pattern', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Regex result' } },
      },
    },
    '/api/products/heavy-calculation': {
      get: {
        summary: 'CPU Exhaustion DoS Endpoint',
        parameters: [{ name: 'iterations', in: 'query', schema: { type: 'integer', default: 5000000 } }],
        responses: { 200: { description: 'Compute duration' } },
      },
    },
    '/api/auth/users/debug': {
      get: {
        summary: 'Unprotected User List (IDOR / Information Disclosure)',
        responses: { 200: { description: 'Full user list with password hashes' } },
      },
    },
    '/lab/sqli/vulnerable-login': {
      post: {
        summary: 'SQL Injection Login Bypass',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { username: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Login result' } },
      },
    },
    '/lab/sqli/vulnerable-search': {
      get: {
        summary: 'SQL Injection UNION Search',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Query rows' } },
      },
    },
    '/lab/sqli/vulnerable-error': {
      get: {
        summary: 'Error-Based SQL Injection',
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Database response' } },
      },
    },
    '/lab/sqli/vulnerable-blind': {
      get: {
        summary: 'Boolean Blind SQL Injection',
        parameters: [{ name: 'username', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Boolean check' } },
      },
    },
    '/lab/sqli/vulnerable-time': {
      get: {
        summary: 'Time-Based Blind SQL Injection',
        parameters: [{ name: 'category', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Delayed execution' } },
      },
    },
    '/lab/xss/store-review': {
      post: {
        summary: 'Stored XSS in Review Submission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  product_id: { type: 'integer' },
                  reviewer_name: { type: 'string' },
                  content: { type: 'string' },
                  rating: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Stored review' } },
      },
    },
    '/lab/xss/reflected': {
      get: {
        summary: 'Reflected XSS Echo Endpoint',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Reflected payload' } },
      },
    },
    '/lab/ddos/redos': {
      get: {
        summary: 'Catastrophic Regex Backtracking (ReDoS)',
        parameters: [{ name: 'input', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'ReDoS evaluation metrics' } },
      },
    },
    '/lab/ddos/heavy-compute': {
      post: {
        summary: 'CPU Starvation Synchronous Loop',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { iterations: { type: 'integer', default: 8000000 } },
              },
            },
          },
        },
        responses: { 200: { description: 'Compute duration' } },
      },
    },
    '/lab/ddos/live-flood': {
      all: {
        summary: 'Unthrottled Live Flood Target',
        responses: { 200: { description: 'Hit count' } },
      },
    },
  },
};

app.get('/swagger.json', (_req, res) => {
  res.json(SWAGGER_DOC);
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server Gracefully ────────────────────────────────────────────────
async function startServer() {
  try {
    await testConnection();

    app.listen(PORT, HOST, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║        PROJECT NOVA — Backend API            ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Server  : http://${HOST}:${PORT}            ║`);
      console.log(`║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(34)}║`);
      console.log(`║  Health  : http://${HOST}:${PORT}/api/health ║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('[NOVA] Startup notice:', err.message);
  }
}

startServer();

module.exports = app;
