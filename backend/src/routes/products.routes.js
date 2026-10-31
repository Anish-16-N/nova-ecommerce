'use strict';

const express = require('express');
const { query: dbQuery } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── Allowed sort mappings (whitelist to prevent SQL injection) ───────────────
const SORT_MAP = {
  price_asc:  'p.price ASC',
  price_desc: 'p.price DESC',
  rating:     'p.rating DESC NULLS LAST',
  newest:     'p.created_at DESC',
  popular:    'p.total_reviews DESC NULLS LAST',
};

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;
    // Vulnerable mode toggle for ROUTES penetration testing
    const isVulnMode = req.query.vuln === 'true' || req.headers['x-nova-vuln'] === 'true' || (search && (search.includes("'") || search.includes("--") || search.includes("union")));
    const orderBy  = isVulnMode && req.query.sort_raw ? req.query.sort_raw : (SORT_MAP[sort] || SORT_MAP.newest);

    const conditions = ['p.is_active = true'];
    const params = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.slug = $${paramIdx++}`);
      params.push(category);
    }

    if (search) {
      if (isVulnMode) {
        // ⚠️ INTENTIONALLY VULNERABLE: Direct string interpolation for testing ROUTES detection
        conditions.push(`(p.name ILIKE '%${search}%' OR p.description ILIKE '%${search}%')`);
      } else {
        conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
      }
    }

    if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
      conditions.push(`p.price >= $${paramIdx++}`);
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
      conditions.push(`p.price <= $${paramIdx++}`);
      params.push(parseFloat(maxPrice));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await dbQuery(
      `SELECT COUNT(*) AS total
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, limitNum, offset];
    const dataResult = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.description, p.price, p.compare_price,
         p.image_url, p.images, p.brand, p.sku, p.stock_quantity,
         p.rating, p.total_reviews, p.is_featured, p.is_active, p.created_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum * limitNum < total,
        hasPrev:    pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/featured ──────────────────────────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '8', 10));

    const result = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.price, p.compare_price,
         p.image_url, p.brand, p.rating, p.total_reviews, p.stock_quantity,
         c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.is_featured = true
       ORDER BY p.rating DESC NULLS LAST, p.total_reviews DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/best-sellers ──────────────────────────────────────────
router.get('/best-sellers', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '8', 10));

    const result = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.price, p.compare_price,
         p.image_url, p.brand, p.rating, p.total_reviews, p.stock_quantity,
         COALESCE(SUM(oi.quantity), 0) AS units_sold,
         c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       WHERE p.is_active = true
       GROUP BY p.id, c.id
       ORDER BY units_sold DESC, p.rating DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/new-arrivals ──────────────────────────────────────────
router.get('/new-arrivals', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '8', 10));

    const result = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.price, p.compare_price,
         p.image_url, p.brand, p.rating, p.total_reviews, p.stock_quantity,
         c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/categories ────────────────────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT
         c.id, c.name, c.slug, c.description, c.image_url,
         COUNT(p.id) FILTER (WHERE p.is_active = true) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.display_order ASC NULLS LAST, c.name ASC`,
      []
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/category/:slug ────────────────────────────────────────
router.get('/category/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { sort = 'newest', page = 1, limit = 20 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;
    const orderBy  = SORT_MAP[sort] || SORT_MAP.newest;

    // Validate category exists
    const catResult = await dbQuery(
      'SELECT id, name, slug, description, image_url FROM categories WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (catResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const category = catResult.rows[0];

    const countResult = await dbQuery(
      'SELECT COUNT(*) AS total FROM products WHERE category_id = $1 AND is_active = true',
      [category.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const productsResult = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.price, p.compare_price,
         p.image_url, p.images, p.brand, p.sku, p.stock_quantity,
         p.rating, p.total_reviews, p.is_featured, p.created_at
       FROM products p
       WHERE p.category_id = $1 AND p.is_active = true
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [category.id, limitNum, offset]
    );

    res.json({
      success: true,
      category,
      data: productsResult.rows,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum * limitNum < total,
        hasPrev:    pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID.' });
    }

    const productResult = await dbQuery(
      `SELECT
         p.id, p.name, p.slug, p.description, p.price, p.compare_price,
         p.image_url, p.images, p.brand, p.sku, p.stock_quantity,
         p.rating, p.total_reviews, p.is_featured, p.is_active,
         p.specifications, p.tags, p.created_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = true`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const product = productResult.rows[0];

    // Fetch recent reviews
    const reviewsResult = await dbQuery(
      `SELECT
         r.id, r.rating, r.title, r.body, r.helpful_count, r.created_at,
         u.username, u.full_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [productId]
    );

    res.json({
      success: true,
      data: {
        ...product,
        reviews: reviewsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// ⚠️ INTENTIONALLY VULNERABLE ENDPOINTS FOR ROUTES REMEDIATION TESTING
// =============================================================================

// 1. Raw Unescaped SQL Search (SQL Injection)
router.get('/search/raw', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const sql = `SELECT p.id, p.name, p.price, p.brand, p.image_url, p.rating FROM products p WHERE p.name ILIKE '%${q}%' OR p.description ILIKE '%${q}%'`;
    const result = await dbQuery(sql);
    res.json({
      success: true,
      count: result.rows.length,
      query: sql,
      data: result.rows,
      warning: '⚠️ INTENTIONALLY VULNERABLE: Direct SQL interpolation without parameterization.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. ReDoS (Regular Expression Denial of Service)
router.get('/filter/regex', (req, res) => {
  const pattern = req.query.pattern || 'test';
  const start = Date.now();
  // Vulnerable exponential backtracking regex
  const evilRegex = /^([a-zA-Z0-9]+)*$/;
  const match = evilRegex.test(pattern);
  const durationMs = Date.now() - start;

  res.json({
    success: true,
    patternLength: pattern.length,
    durationMs,
    blockedEventLoop: durationMs > 500,
    match,
    warning: durationMs > 500 ? `⚠️ ReDoS triggered! Event loop blocked for ${durationMs}ms.` : 'Normal regex evaluation.'
  });
});

// 3. Heavy CPU Computation (Application-Layer DoS)
router.get('/heavy-calculation', (req, res) => {
  const iterations = Math.min(parseInt(req.query.iterations, 10) || 5000000, 30000000);
  const start = Date.now();
  let count = 0;
  for (let i = 0; i < iterations; i++) {
    count += Math.sqrt(i) * Math.sin(i);
  }
  const durationMs = Date.now() - start;

  res.json({
    success: true,
    iterations,
    durationMs,
    count: count.toFixed(2),
    warning: durationMs > 300 ? `⚠️ CPU Starvation: Executed for ${durationMs}ms synchronously.` : 'Completed.'
  });
});

module.exports = router;
