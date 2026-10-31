'use strict';

const express = require('express');
const { query: dbQuery, withTransaction } = require('../database/db');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { logEvent } = require('../logging/logger');

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DELIVERY_FEE = 99;
const FREE_DELIVERY_THRESHOLD = 999;

function getCartOwner(req) {
  if (req.user) return { user_id: req.user.id, session_id: null };
  const session_id = req.headers['x-session-id'] || req.query.session_id;
  return { user_id: null, session_id: session_id || null };
}

async function fetchCart(owner) {
  const { user_id, session_id } = owner;
  const condition = user_id
    ? 'ci.user_id = $1'
    : 'ci.session_id = $1 AND ci.user_id IS NULL';
  const param = user_id || session_id;
  if (!param) return [];

  const result = await dbQuery(
    `SELECT
       ci.id, ci.product_id, ci.quantity, ci.added_at,
       p.name, p.slug, p.brand, p.price, p.compare_price,
       p.discount_percentage, p.image_url, p.stock_quantity, p.is_active
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ${condition}
     ORDER BY ci.added_at ASC`,
    [param]
  );
  return result.rows;
}

function computeTotals(items) {
  let subtotal = 0;
  let savings  = 0;
  for (const item of items) {
    const unit = parseFloat(item.price);
    const disc = parseFloat(item.discount_percentage || 0);
    const discounted = Math.round(unit * (1 - disc / 100) * 100) / 100;
    subtotal += discounted * item.quantity;
    savings  += (unit - discounted) * item.quantity;
  }
  const delivery = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + delivery;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    savings:  Math.round(savings  * 100) / 100,
    delivery_fee: delivery,
    total:    Math.round(total    * 100) / 100,
  };
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const owner = getCartOwner(req);
    const items = await fetchCart(owner);
    const totals = computeTotals(items);
    res.json({ success: true, data: { items, ...totals, count: items.length } });
  } catch (err) { next(err); }
});

// ─── POST /api/cart ───────────────────────────────────────────────────────────
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!product_id || isNaN(parseInt(product_id))) {
      return res.status(400).json({ success: false, error: 'Valid product_id is required.' });
    }

    // Check product exists and has stock
    const prodCheck = await dbQuery(
      'SELECT id, stock_quantity, is_active FROM products WHERE id = $1',
      [parseInt(product_id)]
    );
    if (prodCheck.rows.length === 0 || !prodCheck.rows[0].is_active) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    if (prodCheck.rows[0].stock_quantity < qty) {
      return res.status(400).json({ success: false, error: 'Insufficient stock.' });
    }

    const { user_id, session_id } = getCartOwner(req);
    if (!user_id && !session_id) {
      return res.status(400).json({ success: false, error: 'Session ID required for guest cart (X-Session-ID header).' });
    }

    if (user_id) {
      await dbQuery(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()
         WHERE cart_items.user_id IS NOT NULL`,
        [user_id, parseInt(product_id), qty]
      );
    } else {
      await dbQuery(
        `INSERT INTO cart_items (session_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()
         WHERE cart_items.session_id IS NOT NULL AND cart_items.user_id IS NULL`,
        [session_id, parseInt(product_id), qty]
      );
    }

    logEvent({ endpoint: req.path, method: 'POST', eventCategory: 'CART', severity: 'INFO',
      message: `Item added to cart: product ${product_id}`, userId: user_id });

    const items = await fetchCart({ user_id, session_id });
    const totals = computeTotals(items);
    res.status(201).json({ success: true, message: 'Item added to cart.', data: { items, ...totals, count: items.length } });
  } catch (err) { next(err); }
});

// ─── PUT /api/cart/:productId ─────────────────────────────────────────────────
router.put('/:productId', optionalAuth, async (req, res, next) => {
  try {
    const product_id = parseInt(req.params.productId, 10);
    const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    if (isNaN(product_id)) return res.status(400).json({ success: false, error: 'Invalid product ID.' });

    const { user_id, session_id } = getCartOwner(req);
    const condition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
    const param = user_id || session_id;

    const result = await dbQuery(
      `UPDATE cart_items SET quantity = $2, updated_at = NOW()
       WHERE product_id = $3 AND ${condition} RETURNING id`,
      [param, qty, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found.' });
    }

    const items = await fetchCart({ user_id, session_id });
    const totals = computeTotals(items);
    res.json({ success: true, message: 'Cart updated.', data: { items, ...totals, count: items.length } });
  } catch (err) { next(err); }
});

// ─── DELETE /api/cart/:productId ──────────────────────────────────────────────
router.delete('/:productId', optionalAuth, async (req, res, next) => {
  try {
    const product_id = parseInt(req.params.productId, 10);
    if (isNaN(product_id)) return res.status(400).json({ success: false, error: 'Invalid product ID.' });

    const { user_id, session_id } = getCartOwner(req);
    const condition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
    const param = user_id || session_id;

    await dbQuery(
      `DELETE FROM cart_items WHERE product_id = $2 AND ${condition}`,
      [param, product_id]
    );

    const items = await fetchCart({ user_id, session_id });
    const totals = computeTotals(items);
    res.json({ success: true, message: 'Item removed.', data: { items, ...totals, count: items.length } });
  } catch (err) { next(err); }
});

// ─── DELETE /api/cart ──────────────────────────────────────────────────────────
router.delete('/', optionalAuth, async (req, res, next) => {
  try {
    const { user_id, session_id } = getCartOwner(req);
    const condition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
    const param = user_id || session_id;
    if (param) await dbQuery(`DELETE FROM cart_items WHERE ${condition}`, [param]);
    res.json({ success: true, message: 'Cart cleared.', data: { items: [], subtotal: 0, savings: 0, delivery_fee: 0, total: 0, count: 0 } });
  } catch (err) { next(err); }
});

module.exports = router;

