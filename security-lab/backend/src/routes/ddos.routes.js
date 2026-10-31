/**
 * NOVA Security Lab — Denial of Service (DoS / DDoS) Simulation Routes
 *
 * ============================================================
 * ⚠️  ISOLATED VIRTUAL TRAFFIC SIMULATION ONLY
 * ⚠️  Does NOT launch real distributed attacks or flood external networks.
 * ⚠️  Demonstrates server capacity exhaustion, rate limiting, and defensive metrics.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const labLogger = require('../labLogger');

// Lab specific local rate limiter test
const testLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Max 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 429,
    blocked: true,
    error: 'Too Many Requests — Rate limiter triggered! Protection successful.',
  },
});

// ─── 1. ATTACK SCENARIOS CATALOGUE ────────────────────────────────────────────

router.get('/scenarios', (_req, res) => {
  res.json({
    success: true,
    scenarios: [
      {
        id: 'volumetric',
        name: 'Volumetric Attack (UDP / ICMP Flood Concept)',
        description: 'Saturates available network bandwidth with huge request volumes.',
        typicalTarget: 'Network interfaces and edge gateways',
        defaultRps: 500,
        defenses: ['Traffic scrubbing', 'Bandwidth scaling', 'Upstream ISP blackholing'],
      },
      {
        id: 'protocol',
        name: 'Protocol Attack (SYN Flood Concept)',
        description: 'Exhausts connection state tables by opening semi-open connections.',
        typicalTarget: 'Firewalls, load balancers, OS socket tables',
        defaultRps: 200,
        defenses: ['SYN Cookies', 'State table tuning', 'Connection timeouts'],
      },
      {
        id: 'application',
        name: 'Application-Layer HTTP Flood',
        description: 'Overwhelms CPU and database pools using resource-heavy GET/POST requests.',
        typicalTarget: 'Web application backend, database connection pool',
        defaultRps: 150,
        defenses: ['Rate limiting', 'Web Application Firewall (WAF)', 'Caching'],
      },
      {
        id: 'slowloris',
        name: 'Slow Connection Attack (Slowloris)',
        description: 'Holds connections open indefinitely with slow, incomplete HTTP headers.',
        typicalTarget: 'Threaded web servers (Apache, IIS)',
        defaultRps: 50,
        defenses: ['Aggressive connection timeouts', 'Reverse proxy buffer (Nginx/Envoy)', 'Minimum transfer rate enforcement'],
      },
    ],
  });
});

// ─── 2. VIRTUAL TRAFFIC SIMULATION ENGINE ─────────────────────────────────────

// POST /lab/ddos/simulate
router.post('/simulate', (req, res) => {
  const {
    attackType = 'application',
    duration = 10, // seconds (max 30)
    requestsPerSecond = 100, // max 500
    concurrency = 20, // max 50
    rateLimitingEnabled = false,
    cachingEnabled = false,
  } = req.body;

  // Strict safety limits for virtual simulation
  const safeDuration = Math.min(Math.max(parseInt(duration, 10) || 5, 1), 30);
  const safeRps = Math.min(Math.max(parseInt(requestsPerSecond, 10) || 50, 10), 1000);
  const safeConcurrency = Math.min(Math.max(parseInt(concurrency, 10) || 5, 1), 50);

  // Virtual Server Baseline Capacity
  const serverCapacityRps = 120; // Maximum requests/sec server handles comfortably

  const totalAttempted = safeDuration * safeRps;
  const timeline = [];
  let successfulRequests = 0;
  let rejectedRequests = 0;
  let totalLatency = 0;

  for (let second = 1; second <= safeDuration; second++) {
    let currentCapacity = serverCapacityRps;
    if (cachingEnabled) currentCapacity *= 2.5; // Caching absorbs 2.5x traffic

    let accepted = 0;
    let rejected = 0;
    let latency = 25; // baseline ms

    if (rateLimitingEnabled) {
      // Rate limiting cleanly caps traffic at server capacity
      accepted = Math.min(safeRps, currentCapacity);
      rejected = Math.max(0, safeRps - currentCapacity);
      latency = Math.round(30 + Math.random() * 20);
    } else {
      // Without protection: load spikes, queue delays, server degrades
      const loadRatio = safeRps / currentCapacity;
      if (loadRatio <= 1.0) {
        accepted = safeRps;
        rejected = 0;
        latency = Math.round(25 + loadRatio * 40);
      } else {
        // Overload condition
        accepted = Math.round(currentCapacity * (1 - Math.min(0.4, (loadRatio - 1) * 0.15)));
        rejected = safeRps - accepted;
        latency = Math.round(200 + (loadRatio - 1) * 450 + Math.random() * 150);
      }
    }

    successfulRequests += accepted;
    rejectedRequests += rejected;
    totalLatency += latency;

    timeline.push({
      second,
      attempted: safeRps,
      accepted,
      rejected,
      latencyMs: latency,
      cpuPercent: Math.min(100, Math.round(20 + (safeRps / currentCapacity) * 55)),
    });
  }

  const avgResponseTimeMs = Math.round(totalLatency / safeDuration);
  const errorRatePercent = Math.round((rejectedRequests / totalAttempted) * 100);
  const serverAvailability = Math.max(0, 100 - errorRatePercent);

  labLogger.logLabEvent({
    endpoint: '/lab/ddos/simulate',
    method: 'POST',
    demoModule: 'ddos',
    attackType,
    detectionResult: errorRatePercent > 30 ? 'overloaded' : 'resilient',
    severity: errorRatePercent > 50 ? 'critical' : errorRatePercent > 20 ? 'high' : 'low',
    message: `Virtual simulation: ${attackType} at ${safeRps} rps for ${safeDuration}s. Availability: ${serverAvailability}%`,
    extra: {
      rateLimitingEnabled,
      cachingEnabled,
      totalAttempted,
      successfulRequests,
      rejectedRequests,
    },
  });

  res.json({
    success: true,
    simulationConfig: {
      attackType,
      duration: safeDuration,
      requestsPerSecond: safeRps,
      concurrency: safeConcurrency,
      defenses: {
        rateLimiting: rateLimitingEnabled,
        caching: cachingEnabled,
      },
    },
    metrics: {
      totalAttempted,
      successfulRequests,
      rejectedRequests,
      avgResponseTimeMs,
      errorRatePercent,
      serverAvailability,
      peakCpuPercent: Math.max(...timeline.map(t => t.cpuPercent)),
    },
    timeline,
  });
});

// ─── 3. LIVE RATE LIMITING DEMONSTRATION ──────────────────────────────────────

// GET /lab/ddos/test-rate-limit
router.get('/test-rate-limit', testLimiter, (req, res) => {
  res.json({
    success: true,
    message: 'Request allowed through rate limiter.',
    timestamp: new Date().toISOString(),
    tip: 'Make 10 quick requests to trigger the 429 Too Many Requests response.',
  });
});

module.exports = router;

