'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query: dbQuery, withTransaction } = require('../database/db');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { logEvent } = require('../logging/logger');

const router = express.Router();

const DELIVERY_FEE = 99;
const FREE_DELIVERY_THRESHOLD = 999;

function getOwner(req) {
  if (req.user) return { user_id: req.user.id, session_id: null };
  const session_id = req.headers['x-session-id'] || req.query.session_id || req.cookies?.['nova_session'];
  return { user_id: null, session_id: session_id || null };
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { shipping_address, payment_method, notes } = req.body;

    if (!shipping_address || !payment_method) {
      return res.status(400).json({ success: false, error: 'shipping_address and payment_method are required.' });
    }

    const { user_id, session_id } = getOwner(req);
    const cartCondition = user_id ? 'ci.user_id = $1' : 'ci.session_id = $1 AND ci.user_id IS NULL';
    const cartParam = user_id || session_id;

    if (!cartParam) return res.status(400).json({ success: false, error: 'No cart session found.' });

    const cartResult = await dbQuery(
      `SELECT ci.product_id, ci.quantity,
              p.name, p.brand, p.price, p.compare_price, p.discount_percentage, p.image_url, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ${cartCondition}`,
      [cartParam]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' });
    }

    const items = cartResult.rows;

    // Compute totals
    let subtotal = 0;
    let discountAmount = 0;
    for (const item of items) {
      const unit = parseFloat(item.price);
      const disc = parseFloat(item.discount_percentage || 0);
      const discounted = Math.round(unit * (1 - disc / 100) * 100) / 100;
      const original  = unit * item.quantity;
      const final     = discounted * item.quantity;
      subtotal      += final;
      discountAmount += (original - final);
    }
    const deliveryFee = subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
    const totalAmount = subtotal + deliveryFee;

    // Estimated delivery: 3-7 business days
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const orderId = await withTransaction(async (tq) => {
      // Create order
      const orderRes = await tq(
        `INSERT INTO orders
           (order_number, user_id, session_id, status, subtotal, discount_amount, delivery_fee,
            total_amount, shipping_address, estimated_delivery, notes)
         VALUES ('', $1, $2, 'confirmed', $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, order_number`,
        [
          user_id || null, session_id || null,
          Math.round(subtotal * 100) / 100,
          Math.round(discountAmount * 100) / 100,
          deliveryFee,
          Math.round(totalAmount * 100) / 100,
          JSON.stringify(shipping_address),
          estimatedDelivery.toISOString().split('T')[0],
          notes || null,
        ]
      );
      const { id: oid } = orderRes.rows[0];

      // Insert order items
      for (const item of items) {
        const unit = parseFloat(item.price);
        const disc = parseFloat(item.discount_percentage || 0);
        const finalPrice = Math.round(unit * (1 - disc / 100) * 100) / 100;
        await tq(
          `INSERT INTO order_items
             (order_id, product_id, product_name, product_image, brand, quantity, unit_price, discount_percentage, final_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [oid, item.product_id, item.name, item.image_url, item.brand,
           item.quantity, unit, disc, finalPrice]
        );
      }

      // Clear cart
      const clearCondition = user_id ? 'user_id = $1' : 'session_id = $1 AND user_id IS NULL';
      await tq(`DELETE FROM cart_items WHERE ${clearCondition}`, [cartParam]);

      return oid;
    });

    // Fetch created order with number
    const orderDetails = await dbQuery(
      `SELECT o.*, json_agg(json_build_object(
         'product_id', oi.product_id, 'product_name', oi.product_name,
         'product_image', oi.product_image, 'brand', oi.brand,
         'quantity', oi.quantity, 'unit_price', oi.unit_price,
         'discount_percentage', oi.discount_percentage, 'final_price', oi.final_price
       )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    logEvent({
      requestId: req.requestId, endpoint: req.path, method: 'POST',
      eventCategory: 'ORDER', statusCode: 201, severity: 'INFO',
      message: `Order created: ${orderDetails.rows[0].order_number}`,
      userId: user_id,
    });

    res.status(201).json({ success: true, message: 'Order placed.', data: orderDetails.rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /api/orders/:id/payment ─────────────────────────────────────────────
router.post('/:id/payment', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_details = {} } = req.body;

    if (!payment_method) return res.status(400).json({ success: false, error: 'payment_method required.' });

    // Verify order exists
    const orderRes = await dbQuery('SELECT id, total_amount, status FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Order not found.' });

    const order = orderRes.rows[0];

    // Mock payment: 100% success for demo reliability
    const success = true;
    const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Sanitise payment_details — NEVER store card numbers, CVV, PIN, OTP
    const safeDetails = {
      method: payment_method,
      ...(payment_details.bank ? { bank: payment_details.bank } : {}),
      ...(payment_details.upi_id ? { upi_id: payment_details.upi_id } : {}),
      ...(payment_details.card_type ? { card_type: payment_details.card_type } : {}),
      // Explicitly exclude: card_number, cvv, pin, otp, password
    };

    const status = success ? 'success' : 'failed';

    await dbQuery(
      `INSERT INTO mock_transactions
         (order_id, transaction_id, payment_method, payment_details, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, transactionId, payment_method, JSON.stringify(safeDetails), order.total_amount, status]
    );

    if (success) {
      await dbQuery(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [id]);
    }

    logEvent({
      requestId: req.requestId, endpoint: req.path, method: 'POST',
      eventCategory: 'ORDER', statusCode: 200, severity: 'INFO',
      message: `Payment ${status} for order ${id}: method=${payment_method}, txn=${transactionId}`,
      userId: req.user?.id,
    });

    res.json({
      success: true,
      data: {
        transaction_id: transactionId,
        payment_method,
        amount: order.total_amount,
        status,
        message: success ? 'Payment successful!' : 'Payment failed. Please try again.',
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { user_id, session_id } = getOwner(req);
    const param = user_id || session_id;
    if (!param) return res.json({ success: true, data: [] });
    const condition = user_id ? 'o.user_id = $1' : 'o.session_id = $1 AND o.user_id IS NULL';
    const result = await dbQuery(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, o.estimated_delivery,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${condition}
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [param]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, session_id } = getOwner(req);
    const condition = user_id ? 'o.user_id = $2' : 'o.session_id = $2 AND o.user_id IS NULL';
    const param = user_id || session_id;

    const result = await dbQuery(
      `SELECT o.*, mt.transaction_id, mt.payment_method, mt.status AS payment_status, mt.amount AS paid_amount,
              json_agg(json_build_object(
                'product_id', oi.product_id, 'product_name', oi.product_name,
                'product_image', oi.product_image, 'brand', oi.brand,
                'quantity', oi.quantity, 'unit_price', oi.unit_price,
                'discount_percentage', oi.discount_percentage, 'final_price', oi.final_price
              )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN mock_transactions mt ON mt.order_id = o.id
       WHERE o.id = $1 AND ${condition}
       GROUP BY o.id, mt.transaction_id, mt.payment_method, mt.status, mt.amount`,
      [id, param]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Order not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;

