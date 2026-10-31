'use strict';

const request = require('supertest');
const app = require('../../src/server');

describe('Security Lab — XSS (Cross-Site Scripting) Test Suite', () => {
  describe('Stored XSS Demonstration', () => {
    it('POST /lab/xss/store-review should store payload and return warning metadata', async () => {
      const res = await request(app)
        .post('/lab/xss/store-review')
        .send({
          product_id: 1,
          reviewer_name: 'Attacker',
          content: '<img src=x onerror="alert(document.cookie)">',
          rating: 5
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.warning).toBeDefined();
    });

    it('GET /lab/xss/reviews should return both vulnerable (raw) and secure (escaped) views', async () => {
      const res = await request(app).get('/lab/xss/reviews');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.vulnerable)).toBe(true);
      expect(Array.isArray(res.body.secure)).toBe(true);
    });
  });

  describe('Reflected XSS Demonstration', () => {
    it('GET /lab/xss/reflected should reflect raw and escaped parameters', async () => {
      const payload = '<script>alert(1)</script>';
      const res = await request(app)
        .get('/lab/xss/reflected')
        .query({ q: payload });

      expect(res.status).toBe(200);
      expect(res.body.vulnerable).toBe(payload);
      expect(res.body.secure).toContain('&lt;script&gt;');
      expect(res.body.analysis.hasScriptTag).toBe(true);
    });
  });

  describe('DOM XSS Information', () => {
    it('GET /lab/xss/dom-info should provide DOM vulnerability and remediation context', async () => {
      const res = await request(app).get('/lab/xss/dom-info');
      expect(res.status).toBe(200);
      expect(res.body.vulnerableSink).toBeDefined();
      expect(res.body.secureSink).toBeDefined();
    });
  });
});

