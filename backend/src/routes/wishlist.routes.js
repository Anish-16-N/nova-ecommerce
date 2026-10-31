'use strict';

const express = require('express');
const { query: dbQuery } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function getOwner(req) {
  if (req.user) return { user_id: req.user.id, session_id: null };
  const session_id = req.headers['x-session-id'] || req.query.session_id;
  return { user_id: null, session_id: session_id || null };
}

// GET /api/wishlist
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { user_id, session_id } = getOwner(req);
    const param = user_id || session_id;
    if (!param) return res.json({ success: true, data: [] });

    const condition = user_id ? 'wi.user_id = $1' : 'wi.session_id = $1 AND wi.user_id IS NULL';
    const result = await dbQuery(
      `SELECT wi.id, wi.product_id, wi.added_at,
              p.name, p.slug, p.brand, p.price, p.compare_price,
              p.discount_percentage, p.image_url, p.rating, p.stock_quantity
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       WHERE ${condition}
       ORDER BY wi.added_at DESC`,
      [param]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/wishlist
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: 'product_id required.' });

    const { user_id, session_id } = getOwner(req);
    if (!user_id && !session_id) return res.status(400).json({ success: false, error: 'X-Session-ID required.' });

    if (user_id) {
      await dbQuery(
        'INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, parseInt(product_id)]
      );
    } else {
      await dbQuery(
        'INSERT INTO wishlist_items (session_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [session_id, parseInt(product_id)]
      );
    }
    res.status(201).json({ success: true, message: 'Added to wishlist.' });
  } catch (err) { next(err); }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', optionalAuth, async (req, res, next) => {
  try {
    const product_id = parseInt(req.params.productId, 10);
    const { user_id, session_id } = getOwner(req);
    const condition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
    const param = user_id || session_id;
    if (param) await dbQuery(`DELETE FROM wishlist_items WHERE product_id = $2 AND ${condition}`, [param, product_id]);
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) { next(err); }
});

// GET /api/wishlist/check/:productId
router.get('/check/:productId', optionalAuth, async (req, res, next) => {
  try {
    const product_id = parseInt(req.params.productId, 10);
    const { user_id, session_id } = getOwner(req);
    const param = user_id || session_id;
    if (!param) return res.json({ success: true, inWishlist: false });
    const condition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
    const result = await dbQuery(`SELECT id FROM wishlist_items WHERE product_id = $2 AND ${condition} LIMIT 1`, [param, product_id]);
    res.json({ success: true, inWishlist: result.rows.length > 0 });
  } catch (err) { next(err); }
});

module.exports = router;

