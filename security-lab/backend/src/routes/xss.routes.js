/**
 * NOVA Security Lab — Cross-Site Scripting (XSS) Demo Routes
 *
 * ============================================================
 * ⚠️  INTENTIONALLY VULNERABLE — XSS DEMO ONLY
 * ⚠️  Demonstrates Stored XSS, Reflected XSS, and DOM XSS
 * ⚠️  Local lab demonstration for ROUTES remediation platform.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const labLogger = require('../labLogger');
const { adminPool } = require('../database/labDb');

// Helper function to safely escape HTML entities
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── 1. STORED XSS ────────────────────────────────────────────────────────────

// POST /lab/xss/store-review (Stores raw, unescaped payload into demo_reviews)
router.post('/store-review', async (req, res) => {
  const { product_id = 1, reviewer_name = 'Anonymous', content = '', rating = 5 } = req.body;

  try {
    const query = `
      INSERT INTO demo_reviews (product_id, reviewer_name, content, rating, is_demo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, product_id, reviewer_name, content, rating, created_at
    `;
    const result = await adminPool.query(query, [product_id, reviewer_name, content, rating]);
    const stored = result.rows[0];

    const isSuspicious = /<script|onload|onerror|javascript:|svg|iframe|img/i.test(content);

    labLogger.logLabEvent({
      endpoint: '/lab/xss/store-review',
      method: 'POST',
      demoModule: 'xss',
      attackType: 'stored_xss',
      payload: content,
      detectionResult: isSuspicious ? 'detected' : 'clean',
      severity: isSuspicious ? 'high' : 'low',
      message: `Review stored. Suspicious markup detected: ${isSuspicious}`,
    });

    res.status(201).json({
      success: true,
      message: 'Demo review stored successfully.',
      data: stored,
      warning: 'Review was stored with raw unescaped HTML content for demonstration.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /lab/xss/reviews (Returns both raw and secured versions)
router.get('/reviews', async (req, res) => {
  try {
    const result = await adminPool.query('SELECT * FROM demo_reviews ORDER BY id DESC LIMIT 50');
    const reviews = result.rows;

    const securedReviews = reviews.map(r => ({
      ...r,
      reviewer_name: escapeHtml(r.reviewer_name),
      content: escapeHtml(r.content),
    }));

    res.json({
      success: true,
      vulnerable: reviews, // Raw unescaped HTML for vulnerable demonstration
      secure: securedReviews, // HTML-escaped content for secured demonstration
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. REFLECTED XSS ─────────────────────────────────────────────────────────

// GET /lab/xss/reflected?q=... (Demonstrates reflected query parameter)
router.get('/reflected', (req, res) => {
  const rawQuery = req.query.q || '';
  const isSuspicious = /<script|onload|onerror|javascript:|svg|iframe|img/i.test(rawQuery);

  labLogger.logLabEvent({
    endpoint: '/lab/xss/reflected',
    method: 'GET',
    demoModule: 'xss',
    attackType: 'reflected_xss',
    payload: rawQuery,
    detectionResult: isSuspicious ? 'detected' : 'clean',
    severity: isSuspicious ? 'medium' : 'low',
    message: `Reflected search parameter inspected. Malicious pattern: ${isSuspicious}`,
  });

  res.json({
    success: true,
    input: rawQuery,
    vulnerable: rawQuery, // Deliberately unescaped reflection
    secure: escapeHtml(rawQuery), // HTML entity escaped
    analysis: {
      hasScriptTag: /<script/i.test(rawQuery),
      hasEventHandler: /on\w+=/i.test(rawQuery),
      hasHtmlTag: /<[a-z][\s\S]*>/i.test(rawQuery),
    },
  });
});

// ─── 3. DOM-BASED XSS DEMO INFO ───────────────────────────────────────────────

router.get('/dom-info', (req, res) => {
  res.json({
    success: true,
    module: 'DOM-based XSS',
    vulnerableSink: 'element.innerHTML = location.hash.substring(1)',
    secureSink: 'element.textContent = location.hash.substring(1)',
    recommendation: 'Use innerText / textContent or DOMPurify before injecting user-controlled DOM properties.',
  });
});

module.exports = router;

