'use strict';

const request = require('supertest');
const app = require('../../src/server');

describe('Security Lab — SQL Injection Test Suite', () => {
  it('GET /lab/health should return status OK', async () => {
    const res = await request(app).get('/lab/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.lab).toBe('NOVA Cybersecurity Lab');
  });

  describe('Vulnerable vs Secure Search', () => {
    it('GET /lab/sqli/vulnerable-search should execute SQL injection payload', async () => {
      const res = await request(app)
        .get('/lab/sqli/vulnerable-search')
        .query({ q: "' OR '1'='1" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.query).toContain("' OR '1'='1");
      expect(Array.isArray(res.body.rows)).toBe(true);
    });

    it('GET /lab/sqli/secure-search should safely escape SQL injection attempts', async () => {
      const res = await request(app)
        .get('/lab/sqli/secure-search')
        .query({ q: "' OR '1'='1" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.query).toContain('$1');
    });
  });

  describe('Vulnerable vs Secure Login', () => {
    it('POST /lab/sqli/vulnerable-login with bypass payload should trigger authentication bypass', async () => {
      const res = await request(app)
        .post('/lab/sqli/vulnerable-login')
        .send({
          username: "admin' --",
          password: "any_password"
        });

      expect([200, 401]).toContain(res.status);
      expect(res.body.bypassed).toBe(true);
      expect(res.body.query).toContain("admin' --");
    });

    it('POST /lab/sqli/secure-login should reject malformed injection payload safely', async () => {
      const res = await request(app)
        .post('/lab/sqli/secure-login')
        .send({
          username: "admin' --",
          password: "any_password"
        });

      expect([200, 401]).toContain(res.status);
      expect(res.body.bypassed).toBe(false);
      expect(res.body.query).toContain('$1');
    });
  });
});
