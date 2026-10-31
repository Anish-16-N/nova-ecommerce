import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, AlertTriangle, Play, BarChart2, CheckCircle2, Server, Gauge } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LAB_API = '/lab'; // Proxied to port 5001

export default function DDoSLabPage() {
  const [attackType, setAttackType] = useState('application');
  const [rps, setRps] = useState(250);
  const [duration, setDuration] = useState(10);
  const [concurrency, setConcurrency] = useState(20);
  const [rateLimiting, setRateLimiting] = useState(false);
  const [caching, setCaching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${LAB_API}/ddos/simulate`, {
        attackType,
        requestsPerSecond: rps,
        duration,
        concurrency,
        rateLimitingEnabled: rateLimiting,
        cachingEnabled: caching,
      });
      setResults(res.data);
      toast.success('Simulation completed!');
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-page" style={{ padding: '36px 20px', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Activity size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>DoS / DDoS Traffic Simulation Lab</h1>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Simulate excessive volumetric and application-layer load and evaluate resilience mechanisms.</p>
          </div>
        </div>

        {/* Configuration & Simulation Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          <div className="lab-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gauge size={18} color="#818cf8" /> Traffic Generator Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Attack Category</label>
                <select
                  value={attackType}
                  onChange={e => setAttackType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14 }}
                >
                  <option value="application">Application-Layer HTTP Flood</option>
                  <option value="volumetric">Volumetric Saturation (Bandwidth)</option>
                  <option value="protocol">Protocol Semi-Open Flood (SYN/State)</option>
                  <option value="slowloris">Slowloris Slow-Read / Connection Holding</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Requests Per Second (RPS)</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{rps} req/sec</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={rps}
                  onChange={e => setRps(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Simulation Duration</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{duration} seconds</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Defenses Toggles */}
              <div style={{ padding: '14px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#f8fafc' }}>Active Defense Controls</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rateLimiting}
                      onChange={e => setRateLimiting(e.target.checked)}
                    />
                    Token Bucket Rate Limiting
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={caching}
                      onChange={e => setCaching(e.target.checked)}
                    />
                    Edge / Reverse Proxy Cache
                  </label>
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={loading}
                className="btn"
                style={{
                  background: '#6366f1',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Simulating Traffic...' : <><Play size={16} /> Run Virtual Load Simulation</>}
              </button>
            </div>
          </div>

          {/* Results Overview */}
          <div className="lab-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={18} color="#34d399" /> System Availability Telemetry
            </h3>

            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Server Availability</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: results.metrics.serverAvailability > 70 ? '#34d399' : '#ef4444' }}>
                      {results.metrics.serverAvailability}%
                    </div>
                  </div>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Avg Response Time</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: results.metrics.avgResponseTimeMs < 100 ? '#34d399' : '#f59e0b' }}>
                      {results.metrics.avgResponseTimeMs} ms
                    </div>
                  </div>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Accepted Requests</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>
                      {results.metrics.successfulRequests.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Rejected / Throttled</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>
                      {results.metrics.rejectedRequests.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Timeline Visualization */}
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Timeline Load Behavior</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, background: '#0f172a', padding: 8, borderRadius: 8 }}>
                    {results.timeline.map(t => (
                      <div
                        key={t.second}
                        title={`Second ${t.second}: ${t.accepted} accepted, ${t.rejected} rejected`}
                        style={{
                          flex: 1,
                          height: `${Math.min(100, (t.attempted / 500) * 100)}%`,
                          background: t.rejected > 0 ? '#ef4444' : '#10b981',
                          borderRadius: 2,
                          transition: 'height 200ms',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    <span>0s</span>
                    <span>Green = Handled, Red = Dropped</span>
                    <span>{duration}s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Configure parameters on the left and run a simulation to inspect server metrics and rate limiting.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── LIVE REAL-TIME DoS ATTACK TESTING ──────────────────────────────── */}
        <div style={{ marginTop: 24, padding: 24, background: '#1e293b', borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <AlertTriangle size={22} color="#f87171" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Live Local DoS Attack Modules (Active Execution)</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0' }}>Execute real single-threaded event loop starvation, ReDoS backtracking, memory exhaustion, and burst floods.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* 1. ReDoS */}
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>🔥 ReDoS (Catastrophic Regex)</div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                  Evaluates an unanchored overlapping regex: <code style={{ color: '#fbbf24' }}>/^([a-zA-Z0-9]+)*$/</code> with repeating input. Freezes the Node.js event loop for several seconds.
                </p>
              </div>
              <button
                onClick={async () => {
                  toast.loading('Executing ReDoS backtracking on server...', { id: 'redos' });
                  const t0 = Date.now();
                  try {
                    const res = await axios.get(`${LAB_API}/ddos/redos?input=aaaaaaaaaaaaaaaaaaaaaaaaaaaa!`);
                    const duration = Date.now() - t0;
                    toast.success(`ReDoS completed: Event loop blocked for ${res.data.durationMs}ms (Roundtrip: ${duration}ms)`, { id: 'redos', duration: 5000 });
                  } catch (e) {
                    toast.error('ReDoS failed or timed out: ' + e.message, { id: 'redos' });
                  }
                }}
                className="btn btn-sm"
                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', width: '100%', fontWeight: 700 }}
              >
                Trigger ReDoS Attack
              </button>
            </div>

            {/* 2. CPU Exhaustion */}
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>⚡ CPU Starvation Loop</div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                  Forces a synchronous single-threaded calculation (10M iterations), spiking CPU to 100% and halting all concurrent users.
                </p>
              </div>
              <button
                onClick={async () => {
                  toast.loading('Submitting heavy synchronous load...', { id: 'cpu' });
                  try {
                    const res = await axios.post(`${LAB_API}/ddos/heavy-compute`, { iterations: 10000000 });
                    toast.success(`CPU loop finished in ${res.data.durationMs}ms!`, { id: 'cpu', duration: 4000 });
                  } catch (e) {
                    toast.error('Failed: ' + e.message, { id: 'cpu' });
                  }
                }}
                className="btn btn-sm"
                style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fbbf24', width: '100%', fontWeight: 700 }}
              >
                Trigger CPU Starvation
              </button>
            </div>

            {/* 3. Real Browser Burst Flood */}
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>🌊 Live Browser Burst (50 reqs)</div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                  Dispatches 50 simultaneous parallel requests directly from your browser to the un-throttled endpoint to measure latency degradation.
                </p>
              </div>
              <button
                onClick={async () => {
                  toast.loading('Firing 50 parallel requests...', { id: 'flood' });
                  const t0 = Date.now();
                  try {
                    const promises = Array.from({ length: 50 }).map(() => axios.get(`${LAB_API}/ddos/live-flood`));
                    await Promise.all(promises);
                    const totalMs = Date.now() - t0;
                    toast.success(`50/50 requests resolved in ${totalMs}ms!`, { id: 'flood', duration: 4000 });
                  } catch (e) {
                    toast.error('Flood failed: ' + e.message, { id: 'flood' });
                  }
                }}
                className="btn btn-sm"
                style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', width: '100%', fontWeight: 700 }}
              >
                Launch 50-Request Burst
              </button>
            </div>

            {/* 4. Memory Heap Bloat */}
            <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>💾 Memory Heap Bloat (20MB)</div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
                  Allocates 20MB uncollected buffer chunks in Node.js memory. Tests heap exhaustion and OOM crashes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${LAB_API}/ddos/memory-spike`, { mb: 20 });
                      toast.success(`Allocated +20MB! Heap: ${res.data.currentHeapUsedMb}MB (Held: ${res.data.totalBuffersHeld})`);
                    } catch (e) {
                      toast.error('Failed: ' + e.message);
                    }
                  }}
                  className="btn btn-sm"
                  style={{ background: 'rgba(192, 132, 252, 0.2)', border: '1px solid #c084fc', color: '#c084fc', flex: 1, fontWeight: 700 }}
                >
                  +20MB Bloat
                </button>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${LAB_API}/ddos/memory-spike`, { action: 'reset' });
                      toast.success('Memory bloat reset!');
                    } catch (e) {
                      toast.error('Failed: ' + e.message);
                    }
                  }}
                  className="btn btn-sm"
                  style={{ background: '#334155', border: 'none', color: '#94a3b8' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

