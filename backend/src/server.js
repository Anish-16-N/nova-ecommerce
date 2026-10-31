'use strict';

require('dotenv').config();

const express = require('express');
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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Request-ID'],
}));

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Request Logging (Morgan) ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── JSONL Custom Request Logger ────────────────────────────────────────────
app.use(requestLogger);

// ─── Global Rate Limiter ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Auth-specific stricter rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'NOVA Backend API',
      version: '1.0.0',
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
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

// ─── Start Server ────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Test DB connection before starting
    await testConnection();
    console.log('[NOVA] ✅ Database connection established');

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
    console.error('[NOVA] ❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; // for testing
