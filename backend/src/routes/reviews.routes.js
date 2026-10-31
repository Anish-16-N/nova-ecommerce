'use strict';

const express = require('express');
const { query: dbQuery } = require('../database/db');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) return res.status(400).json({ success: false, error: 'Invalid product ID.' });

    const result = await dbQuery(
      `SELECT r.id, r.rating, r.title, r.body, r.helpful_count, r.is_verified_purchase, r.created_at,
              r.username, r.full_name
       FROM reviews r
       WHERE r.product_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [productId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/reviews
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { product_id, rating, title, body } = req.body;

    if (!product_id || !rating || !body) {
      return res.status(400).json({ success: false, error: 'product_id, rating, and body are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    // Get user info for display
    const userRes = await dbQuery('SELECT username, full_name FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(401).json({ success: false, error: 'User not found.' });
    const { username, full_name } = userRes.rows[0];

    const result = await dbQuery(
      `INSERT INTO reviews (product_id, user_id, username, full_name, rating, title, body, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, rating, title, body, helpful_count, created_at, username, full_name`,
      [parseInt(product_id), req.user.id, username, full_name, parseInt(rating), title || null, body]
    );

    // Update product average rating
    await dbQuery(
      `UPDATE products SET
         rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND is_approved = TRUE),
         total_reviews = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = TRUE)
       WHERE id = $1`,
      [parseInt(product_id)]
    );

    res.status(201).json({ success: true, message: 'Review submitted.', data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;

