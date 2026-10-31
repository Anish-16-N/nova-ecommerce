import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Play,
  Shield,
  Terminal,
  Copy,
  Info,
  Search,
  Zap,
} from 'lucide-react';

const LAB_API = import.meta.env.VITE_LAB_API_URL || '';

// ── Code snippets ────────────────────────────────────────────────────────────

const VULNERABLE_LOGIN_CODE = `// ⚠ VULNERABLE — Never do this in production
app.post('/lab/sqli/vulnerable-login', (req, res) => {
  const { username, password } = req.body;
  // Direct string interpolation → SQLi
  const query = \`SELECT * FROM users
    WHERE username = '\${username}'
    AND password = '\${password}'\`;
  db.all(query, (err, rows) => {
    res.json({ query, rows, bypassed: rows.length > 0 });
  });
});`;

const SECURE_LOGIN_CODE = `// ✅ SECURE — Parameterised query
app.post('/lab/sqli/secure-login', (req, res) => {
  const { username, password } = req.body;
  const query = \`SELECT * FROM users
    WHERE username = ?
    AND password = ?\`;
  db.all(query, [username, password], (err, rows) => {
    res.json({ query, rows, bypassed: false });
  });
});`;

const VULNERABLE_SEARCH_CODE = `// ⚠ VULNERABLE — Search injection
app.get('/lab/sqli/vulnerable-search', (req, res) => {
  const { q } = req.query;
  const query = \`SELECT * FROM products
    WHERE name LIKE '%\${q}%'\`;
  db.all(query, (err, rows) => {
    res.json({ query, rows });
  });
});`;

const SECURE_SEARCH_CODE = `// ✅ SECURE — Parameterised LIKE
app.get('/lab/sqli/secure-search', (req, res) => {
  const { q } = req.query;
  const query = \`SELECT * FROM products
    WHERE name LIKE ?\`;
  db.all(query, [\`%\${q}%\`], (err, rows) => {
    res.json({ query, rows });
  });
});`;

// ── Payload presets ───────────────────────────────────────────────────────────

const LOGIN_PAYLOADS = [
  { label: "Classic OR bypass", username: "' OR '1'='1", password: "' OR '1'='1" },
  { label: "Admin comment bypass", username: "admin' --", password: "anything" },
  { label: "OR 1=1 comment", username: "' OR 1=1 --", password: "" },
  { label: "Always-true quote", username: "' OR 'x'='x", password: "' OR 'x'='x" },
];

const SEARCH_PAYLOADS = [
  { label: "UNION Exfiltrate Customers", q: "' UNION SELECT id, username, email FROM demo_customers--" },
  { label: "Error-Based Cast Data Leak", q: "1' AND 1=cast((SELECT username FROM demo_customers LIMIT 1) as int)--" },
  { label: "Time-Based Sleep (3 Seconds)", q: "' AND 1=(SELECT 1 FROM pg_sleep(3))--" },
  { label: "Boolean Blind (TRUE Condition)", q: "admin' AND (SELECT 1)=1--" },
  { label: "Boolean Blind (FALSE Condition)", q: "admin' AND (SELECT 1)=2--" },
  { label: "ORDER BY Condition Toggle", q: "(CASE WHEN 1=1 THEN price ELSE name END) ASC" },
  { label: "Wildcard dump", q: "%" },
  { label: "Comment bypass", q: "anything' OR '1'='1" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, isVulnerable }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-lg overflow-hidden text-xs"
      style={{ border: `1px solid ${isVulnerable ? '#ef444440' : '#22c55e40'}` }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: isVulnerable ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.10)' }}
      >
        <span
          className="font-semibold font-mono"
          style={{ color: isVulnerable ? '#f87171' : '#4ade80' }}
        >
          {label}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all hover:opacity-80"
          style={{ color: '#64748b' }}
        >
          <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre
        className="p-4 overflow-x-auto leading-relaxed"
        style={{ background: '#0a0f1a', color: '#94a3b8', fontFamily: 'monospace', margin: 0 }}
      >
        {code}
      </pre>
    </div>
  );
}

function ResultPanel({ title, result, isVulnerable }) {
  if (!result) return null;
  const triggered = result.bypassed || (result.rows && result.rows.length > 0 && isVulnerable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4 text-xs font-mono space-y-2"
      style={{
        background: triggered ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${triggered ? '#ef444440' : '#22c55e40'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {triggered
          ? <XCircle className="w-4 h-4 text-red-400" />
          : <CheckCircle2 className="w-4 h-4 text-green-400" />}
        <span
          className="font-bold text-sm"
          style={{ color: triggered ? '#f87171' : '#4ade80' }}
        >
          {title} — {triggered ? '⚠ Vulnerability Triggered' : '✅ Protected'}
        </span>
      </div>

      {result.query && (
        <div>
          <span style={{ color: '#64748b' }}>Query executed:</span>
          <pre
            className="mt-1 p-2 rounded overflow-x-auto"
            style={{ background: '#0a0f1a', color: '#fbbf24', margin: 0 }}
          >
            {result.query}
          </pre>
        </div>
      )}

      <div>
        <span style={{ color: '#64748b' }}>
          Rows returned: <strong style={{ color: '#e2e8f0' }}>{result.rows?.length ?? 0}</strong>
        </span>
      </div>

      {result.rows && result.rows.length > 0 && (
        <div>
          <span style={{ color: '#64748b' }}>Data leaked:</span>
          <pre
            className="mt-1 p-2 rounded overflow-x-auto"
            style={{ background: '#0a0f1a', color: '#f87171', margin: 0 }}
          >
            {JSON.stringify(result.rows, null, 2)}
          </pre>
        </div>
      )}

      {result.error && (
        <p style={{ color: '#fb923c' }}>Error: {result.error}</p>
      )}
    </motion.div>
  );
}

function EventLog({ events }) {
  const listRef = useRef(null);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#0a0f1a', border: '1px solid #1e293b' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-green-400" />
        <span className="text-xs font-semibold font-mono" style={{ color: '#4ade80' }}>
          Event Log
        </span>
      </div>
      <div
        ref={listRef}
        className="space-y-1 overflow-y-auto text-xs font-mono"
        style={{ maxHeight: '180px', color: '#64748b' }}
      >
        {events.length === 0 && (
          <p style={{ color: '#334155' }}>No events yet. Run a test to begin.</p>
        )}
        {events.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span style={{ color: '#334155' }}>{ev.ts}</span>
            <span style={{ color: ev.type === 'vuln' ? '#f87171' : ev.type === 'safe' ? '#4ade80' : '#60a5fa' }}>
              [{ev.endpoint}]
            </span>
            <span style={{ color: '#94a3b8' }}>{ev.msg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SQLiLabPage() {
  const [activeTab, setActiveTab] = useState('login');

  // Login tab state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [vulnLoginResult, setVulnLoginResult] = useState(null);
  const [safeLoginResult, setSafeLoginResult] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [vulnSearchResult, setVulnSearchResult] = useState(null);
  const [safeSearchResult, setSafeSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Shared event log
  const [events, setEvents] = useState([]);

  const addEvent = useCallback((endpoint, msg, type) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [...prev.slice(-49), { ts, endpoint, msg, type }]);
  }, []);

  // ── Login handlers ──────────────────────────────────────────────────────────

  const testVulnLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch(`${LAB_API}/lab/sqli/vulnerable-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      setVulnLoginResult(data);
      addEvent(
        'sqli/vulnerable-login',
        data.bypassed ? `BYPASSED — ${data.rows?.length} row(s) returned` : `${data.rows?.length} row(s)`,
        data.bypassed ? 'vuln' : 'info',
      );
    } catch (err) {
      setVulnLoginResult({ error: err.message });
      addEvent('sqli/vulnerable-login', 'Request failed — is the lab backend running?', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const testSafeLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch(`${LAB_API}/lab/sqli/secure-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      setSafeLoginResult(data);
      addEvent('sqli/secure-login', `Protected — ${data.rows?.length} row(s)`, 'safe');
    } catch (err) {
      setSafeLoginResult({ error: err.message });
      addEvent('sqli/secure-login', 'Request failed', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const testVulnSearch = async () => {
    setSearchLoading(true);
    const t0 = Date.now();
    try {
      // Intelligently route to specialized endpoint if specialized attack is selected
      let endpoint = `${LAB_API}/lab/sqli/vulnerable-search?q=${encodeURIComponent(searchQuery)}`;
      if (searchQuery.toLowerCase().includes('cast(')) {
        endpoint = `${LAB_API}/lab/sqli/vulnerable-error?id=${encodeURIComponent(searchQuery)}`;
      } else if (searchQuery.toLowerCase().includes('pg_sleep(')) {
        endpoint = `${LAB_API}/lab/sqli/vulnerable-time?category=${encodeURIComponent(searchQuery)}`;
      } else if (searchQuery.toLowerCase().includes('order by')) {
        endpoint = `${LAB_API}/lab/sqli/vulnerable-order?sort=${encodeURIComponent(searchQuery.replace(/order by/i, '').trim())}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      const elapsed = Date.now() - t0;
      data.elapsedMs = elapsed;
      setVulnSearchResult(data);

      if (data.error) {
        addEvent('sqli/vulnerable-error', `DATA LEAKED VIA ERROR: ${data.error}`, 'vuln');
      } else if (elapsed > 1500 || data.timeDelayed) {
        addEvent('sqli/vulnerable-time', `TIME DELAY EXECUTED: took ${elapsed}ms`, 'vuln');
      } else {
        const count = data.rows?.length || data.products?.length || (data.exists ? 1 : 0);
        addEvent('sqli/vulnerable-search', `${count} row(s) returned`, 'vuln');
      }
    } catch (err) {
      setVulnSearchResult({ error: err.message });
      addEvent('sqli/vulnerable-search', 'Request failed: ' + err.message, 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const testSafeSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await fetch(`${LAB_API}/lab/sqli/secure-search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSafeSearchResult(data);
      addEvent('sqli/secure-search', `Protected — ${data.rows?.length} row(s)`, 'safe');
    } catch (err) {
      setSafeSearchResult({ error: err.message });
      addEvent('sqli/secure-search', 'Request failed', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const tabs = [
    { id: 'login', label: 'Login Bypass', icon: Database },
    { id: 'search', label: 'Search Injection', icon: Search },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Database className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono" style={{ color: '#f1f5f9' }}>
                SQL Injection Lab
              </h1>
              <p className="text-sm" style={{ color: '#64748b' }}>
                NOVA Security Lab › SQLi Module
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-5 mb-8 flex gap-3"
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        >
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1" style={{ color: '#94a3b8' }}>
            <p className="font-semibold" style={{ color: '#e2e8f0' }}>What is SQL Injection?</p>
            <p>
              SQL Injection occurs when user-supplied input is concatenated directly into a SQL query
              without sanitisation. An attacker can manipulate the query logic to bypass authentication,
              dump database contents, or (in writable environments) destroy data.
            </p>
            <p>
              <strong style={{ color: '#ef4444' }}>Vulnerable pattern:</strong>{' '}
              <code className="font-mono" style={{ color: '#fbbf24' }}>
                `SELECT * FROM users WHERE username = '${'{username}'}'`
              </code>
              {' '}— the query is assembled from raw user input.
            </p>
            <p>
              <strong style={{ color: '#4ade80' }}>Secure pattern:</strong>{' '}
              Parameterised queries / prepared statements bind values as data, not SQL syntax.
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-mono transition-all"
              style={{
                background: activeTab === id ? 'rgba(239,68,68,0.15)' : '#1e293b',
                color: activeTab === id ? '#f87171' : '#64748b',
                border: `1px solid ${activeTab === id ? 'rgba(239,68,68,0.4)' : '#334155'}`,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── LOGIN BYPASS TAB ── */}
          {activeTab === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left: Attack Panel */}
              <div className="space-y-5">
                {/* Code snippets */}
                <CodeBlock code={VULNERABLE_LOGIN_CODE} label="⚠ Vulnerable Code" isVulnerable />
                <CodeBlock code={SECURE_LOGIN_CODE} label="✅ Secure Code" isVulnerable={false} />

                {/* Payload presets */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono mb-3" style={{ color: '#64748b' }}>
                    ▸ PRESET PAYLOADS — click to auto-fill
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {LOGIN_PAYLOADS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => { setLoginUser(p.username); setLoginPass(p.password); }}
                        className="text-left p-2 rounded-lg text-xs font-mono transition-all hover:scale-[1.01]"
                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#fbbf24' }}
                      >
                        <span style={{ color: '#64748b' }}>{p.label}: </span>
                        username=<span style={{ color: '#f87171' }}>{p.username}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input form */}
                <div
                  className="rounded-xl p-5 space-y-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono" style={{ color: '#94a3b8' }}>
                    ▸ ATTACK INPUTS
                  </p>
                  <div>
                    <label className="text-xs font-mono mb-1 block" style={{ color: '#64748b' }}>Username</label>
                    <input
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="e.g.  ' OR '1'='1"
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#fbbf24',
                        caretColor: '#fbbf24',
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono mb-1 block" style={{ color: '#64748b' }}>Password</label>
                    <input
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="e.g.  anything"
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#fbbf24',
                        caretColor: '#fbbf24',
                      }}
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={testVulnLogin}
                      disabled={loginLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                    >
                      <Zap className="w-4 h-4" />
                      Test Vulnerable
                    </button>
                    <button
                      onClick={testSafeLogin}
                      disabled={loginLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }}
                    >
                      <Shield className="w-4 h-4" />
                      Test Secure
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Results + Logs */}
              <div className="space-y-5">
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono mb-3" style={{ color: '#94a3b8' }}>
                    ▸ RESULTS COMPARISON
                  </p>
                  <div className="space-y-4">
                    <ResultPanel title="Vulnerable Endpoint" result={vulnLoginResult} isVulnerable />
                    <ResultPanel title="Secure Endpoint" result={safeLoginResult} isVulnerable={false} />
                    {!vulnLoginResult && !safeLoginResult && (
                      <p className="text-xs font-mono text-center py-8" style={{ color: '#334155' }}>
                        Fill in a payload and click Test to see results
                      </p>
                    )}
                  </div>
                </div>
                <EventLog events={events} />
              </div>
            </motion.div>
          )}

          {/* ── SEARCH INJECTION TAB ── */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left */}
              <div className="space-y-5">
                <CodeBlock code={VULNERABLE_SEARCH_CODE} label="⚠ Vulnerable Code" isVulnerable />
                <CodeBlock code={SECURE_SEARCH_CODE} label="✅ Secure Code" isVulnerable={false} />

                {/* Preset payloads */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono mb-3" style={{ color: '#64748b' }}>
                    ▸ PRESET SEARCH PAYLOADS
                  </p>
                  <div className="space-y-2">
                    {SEARCH_PAYLOADS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setSearchQuery(p.q)}
                        className="w-full text-left p-2 rounded-lg text-xs font-mono transition-all hover:scale-[1.01]"
                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#fbbf24' }}
                      >
                        <span style={{ color: '#64748b' }}>{p.label}: </span>
                        <span style={{ color: '#f87171' }}>{p.q}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search input */}
                <div
                  className="rounded-xl p-5 space-y-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono" style={{ color: '#94a3b8' }}>
                    ▸ SEARCH QUERY
                  </p>
                  <div>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g.  % or ' UNION SELECT..."
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#fbbf24',
                        caretColor: '#fbbf24',
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={testVulnSearch}
                      disabled={searchLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                    >
                      <Zap className="w-4 h-4" /> Test Vulnerable
                    </button>
                    <button
                      onClick={testSafeSearch}
                      disabled={searchLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }}
                    >
                      <Shield className="w-4 h-4" /> Test Secure
                    </button>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#1e293b', border: '1px solid #334155' }}
                >
                  <p className="text-xs font-semibold font-mono mb-3" style={{ color: '#94a3b8' }}>
                    ▸ RESULTS COMPARISON
                  </p>
                  <div className="space-y-4">
                    <ResultPanel title="Vulnerable Search" result={vulnSearchResult} isVulnerable />
                    <ResultPanel title="Secure Search" result={safeSearchResult} isVulnerable={false} />
                    {!vulnSearchResult && !safeSearchResult && (
                      <p className="text-xs font-mono text-center py-8" style={{ color: '#334155' }}>
                        Enter a search payload and click Test
                      </p>
                    )}
                  </div>
                </div>
                <EventLog events={events} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
