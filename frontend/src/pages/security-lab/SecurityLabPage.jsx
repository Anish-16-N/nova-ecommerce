import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Database,
  Zap,
  Code2,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Lock,
  Terminal,
  Wifi,
  Server
} from 'lucide-react';

const LAB_API = import.meta.env.VITE_LAB_API_URL || 'http://localhost:5001';

const modules = [
  {
    id: 'sqli',
    name: 'SQL Injection Lab',
    slug: 'sqli',
    icon: Database,
    color: '#ef4444',
    description:
      'Explore classic SQL Injection vulnerabilities including login bypass, UNION-based data extraction, and blind injection. Compare vulnerable vs. parameterised queries side-by-side.',
    status: 'Active',
    techniques: ['Login Bypass', 'UNION Injection', 'Search Injection'],
    path: '/security-lab/sqli',
  },
  {
    id: 'xss',
    name: 'Cross-Site Scripting Lab',
    slug: 'xss',
    icon: Code2,
    color: '#f97316',
    description:
      'Demonstrate Stored XSS, Reflected XSS, and DOM-based XSS in a sandboxed environment. See real payload execution and compare dangerous vs. safe rendering techniques.',
    status: 'Active',
    techniques: ['Stored XSS', 'Reflected XSS', 'DOM-based XSS'],
    path: '/security-lab/xss',
  },
  {
    id: 'ddos',
    name: 'DoS / DDoS Simulation',
    slug: 'ddos',
    icon: Zap,
    color: '#a855f7',
    description:
      'Simulate volumetric, protocol, and application-layer denial-of-service attacks in a local sandbox. Toggle defensive measures and observe real-time impact on server availability metrics.',
    status: 'Active',
    techniques: ['HTTP Flood', 'Slow Loris', 'Volumetric Sim'],
    path: '/security-lab/ddos',
  },
];

const routesSection = [
  {
    label: 'Attack Surface Mapping',
    desc: 'ROUTES automatically crawls the NOVA storefront and identifies injection points tested in the SQLi and XSS labs.',
  },
  {
    label: 'Payload Fuzzing',
    desc: 'Payloads demonstrated in this lab are fed back into ROUTES\'s automated scanner to validate detection coverage.',
  },
  {
    label: 'Metrics Correlation',
    desc: 'DDoS simulation metrics are correlated with ROUTES\'s rate-limit and availability monitors.',
  },
];

function StatusDot({ ok }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
  );
}

export default function SecurityLabPage() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${LAB_API}/lab/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          setBackendStatus('online');
          setDbStatus(data.db === 'ok' ? 'online' : 'degraded');
        } else {
          setBackendStatus('degraded');
          setDbStatus('unknown');
        }
      } catch {
        setBackendStatus('offline');
        setDbStatus('offline');
      }
    }
    checkHealth();
    const id = setInterval(checkHealth, 15000);
    return () => clearInterval(id);
  }, []);

  const statusColor = (s) => {
    if (s === 'online') return 'text-green-400';
    if (s === 'degraded') return 'text-yellow-400';
    return 'text-red-400';
  };

  const statusLabel = (s) => {
    if (s === 'checking') return 'Checking…';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#e2e8f0' }}>
      {/* ── Header ── */}
      <div
        className="border-b"
        style={{ borderColor: '#1e293b', background: 'linear-gradient(135deg,#0f172a 0%,#1a1040 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-4"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'monospace', color: '#f1f5f9' }}
              >
                NOVA <span style={{ color: '#ef4444' }}>Security Lab</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                Cybersecurity Education &amp; Vulnerability Research Platform
              </p>
            </div>
          </motion.div>

          {/* Warning Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 rounded-xl p-4 mt-6"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-300 text-sm">Educational Use Only</p>
              <p className="text-yellow-200/70 text-sm mt-0.5">
                This lab runs in <strong>isolated local demo mode only</strong>. All endpoints are
                sandboxed to localhost and contain <em>intentional vulnerabilities for educational
                purposes</em>. Never expose these endpoints to the public internet or use these
                techniques against systems you do not own.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Module Cards ── */}
        <div className="xl:col-span-2 space-y-6">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#64748b', fontFamily: 'monospace' }}
          >
            ▸ Lab Modules
          </h2>

          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="rounded-xl p-6 flex flex-col gap-4"
                style={{ background: '#1e293b', border: '1px solid #334155' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${mod.color}20`, border: `1px solid ${mod.color}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: mod.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>
                        {mod.name}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        ● {mod.status}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={mod.path}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: `${mod.color}20`, color: mod.color, border: `1px solid ${mod.color}40`, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Open Lab <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-sm" style={{ color: '#94a3b8' }}>{mod.description}</p>

                <div className="flex flex-wrap gap-2">
                  {mod.techniques.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded font-mono"
                      style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* ── ROUTES Integration ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl p-6"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold" style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>
                ROUTES Integration
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              The <strong style={{ color: '#60a5fa' }}>ROUTES</strong> cybersecurity platform uses this
              lab as a live target for automated scanning, payload delivery, and defensive validation.
              The following capabilities are wired together:
            </p>
            <div className="space-y-3">
              {routesSection.map((r, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg"
                  style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                >
                  <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{r.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right Sidebar: System Status ── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-5"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-sm" style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                System Status
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Lab Backend', value: statusLabel(backendStatus), ok: backendStatus === 'online', icon: Wifi },
                { label: 'Database (demo)', value: statusLabel(dbStatus), ok: dbStatus === 'online', icon: Database },
                { label: 'Log File', value: 'Active', ok: true, icon: Terminal },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-4 h-4" style={{ color: '#64748b' }} />
                      <span className="text-sm" style={{ color: '#94a3b8' }}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusDot ok={item.ok} />
                      <span className={`text-xs font-mono font-semibold ${statusColor(item.ok ? 'online' : 'offline')}`}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl p-5"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
              Quick Access
            </h3>
            <div className="space-y-2">
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    to={mod.path}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                    style={{ background: '#0f172a', border: '1px solid #1e293b', textDecoration: 'none' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: mod.color }} />
                    <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{mod.name}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#334155' }} />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl p-5"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
              Indicator Legend
            </h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                { color: '#ef4444', label: 'Vulnerability Triggered' },
                { color: '#f97316', label: 'Partial / Degraded' },
                { color: '#4ade80', label: 'Secure / Protected' },
                { color: '#60a5fa', label: 'Informational' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                  <span style={{ color: '#64748b' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
