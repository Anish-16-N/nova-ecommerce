'use strict';

const express = require('express');
const { query: dbQuery, getClient } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');
const { logEvent } = require('../logging/logger');

const router = express.Router();

// ─── GET /api/orders (Broken Access Control: Dumps all orders without auth) ──
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT o.*, u.email, u.username, u.full_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 50`
    );

    logEvent({
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      eventCategory: 'BROKEN_ACCESS_CONTROL',
      statusCode: 200,
      severity: 'HIGH',
      message: 'Order list accessed without strict ownership filter',
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A01:2021 - Broken Access Control (Unauthenticated Order Dump)',
      count: result.rows.length,
      data: result.rows,
      orders: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ─── GET /api/orders/invoice/:id (Explicit IDOR Endpoint) ────────────────────
router.get('/invoice/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10) || 1;
    const result = await dbQuery(
      `SELECT o.*, u.email, u.username, u.full_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    const invoice = result.rows[0] || {
      id: orderId,
      user_id: 1,
      order_number: `ORD-DEMO-00${orderId}`,
      status: 'delivered',
      total_amount: '54999.00',
      shipping_address: '42 MG Road, Bengaluru, KA 560001',
      email: 'admin@nova-demo.local',
      username: 'admin',
      full_name: 'Admin User',
      phone: '+91-9876543210',
    };

    return res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A01:2021 - Broken Access Control (IDOR Invoice Leak)',
      invoice,
      data: invoice,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ─── GET /api/orders/:id (Broken Access Control / IDOR: Any order by ID) ─────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10) || 1;
    const result = await dbQuery(
      `SELECT o.*, u.email, u.username, u.full_name, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    let items = [];
    try {
      const itemsResult = await dbQuery(
        `SELECT oi.*, p.name AS product_name, p.slug, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      );
      items = itemsResult.rows;
    } catch (_) { }

    const orderData = result.rows[0] || {
      id: orderId,
      user_id: 1,
      order_number: `ORD-DEMO-00${orderId}`,
      status: 'delivered',
      total_amount: '54999.00',
      shipping_address: '42 MG Road, Bengaluru, KA 560001',
      email: 'admin@nova-demo.local',
      username: 'admin',
      full_name: 'Admin User',
      phone: '+91-9876543210',
    };

    return res.status(200).json({
      success: true,
      vulnerable: true,
      vulnerability: 'OWASP A01:2021 - Broken Access Control (IDOR)',
      data: { ...orderData, items },
      order: { ...orderData, items },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ─── POST /api/orders (Allows Price Tampering / Optional Auth Checkout) ──────
router.post('/', optionalAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user?.id || req.body.user_id || 1;
    const {
      shipping_address = '123 Demo Street, Bengaluru',
      payment_method = 'cod',
      total_amount,
    } = req.body;

    const orderNumber = `NOVA-${Date.now()}`;
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, status, total_amount, shipping_address, payment_method, payment_status)
       VALUES ($1, $2, 'pending', $3, $4, $5, 'pending')
       RETURNING *`,
      [userId, orderNumber, total_amount || 999, JSON.stringify(shipping_address), payment_method]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      data: orderResult.rows[0],
      order: orderResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message, stack: err.stack });
  } finally {
    client.release();
  }
});

module.exports = router;