'use strict';

const request = require('supertest');
const app = require('../../src/server');

describe('NOVA E-Commerce API Test Suite', () => {
  const sessionId = 'test-session-' + Date.now();

  describe('System Health & Catalog', () => {
    it('GET /api/health should return status OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/products/categories should return all 6 main categories', async () => {
      const res = await request(app).get('/api/products/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);
    });

    it('GET /api/products should return product catalogue', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/products/:id should return single product with reviews', async () => {
      const res = await request(app).get('/api/products/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBeDefined();
    });
  });

  describe('Cart Operations', () => {
    it('POST /api/cart should add an item to guest cart using X-Session-ID', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('X-Session-ID', sessionId)
        .send({ product_id: 1, quantity: 2 });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /api/cart should fetch current cart with computed totals', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('X-Session-ID', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.subtotal).toBeGreaterThan(0);
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('PUT /api/cart/:productId should update item quantity', async () => {
      const res = await request(app)
        .put('/api/cart/1')
        .set('X-Session-ID', sessionId)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/cart/:productId should remove item from cart', async () => {
      const res = await request(app)
        .delete('/api/cart/1')
        .set('X-Session-ID', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Orders & Checkout Flow', () => {
    let orderId;

    it('POST /api/orders should create an order from cart items', async () => {
      // First ensure cart has an item
      await request(app)
        .post('/api/cart')
        .set('X-Session-ID', sessionId)
        .send({ product_id: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('X-Session-ID', sessionId)
        .send({
          shipping_address: {
            full_name: 'Test Customer',
            email: 'test@example.com',
            phone: '9876543210',
            address_line1: '123 Test Street',
            city: 'Bengaluru',
            state: 'Karnataka',
            pin_code: '560001'
          },
          payment_method: 'upi'
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      orderId = res.body.data.id;
    });

    it('POST /api/orders/:id/payment should process simulated payment', async () => {
      if (!orderId) return;
      const res = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .set('X-Session-ID', sessionId)
        .send({
          payment_method: 'upi',
          payment_details: { upi_id: 'test@upi' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
    });
  });

  describe('Reviews API', () => {
    it('POST /api/reviews should accept guest review with name', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          product_id: 1,
          rating: 5,
          title: 'Outstanding quality!',
          body: 'Loved using this product. Exceeded my expectations.',
          name: 'Priya Sharma'
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/reviews/product/1 should return product reviews list', async () => {
      const res = await request(app).get('/api/reviews/product/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

