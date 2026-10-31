import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, AlertTriangle, Shield, CheckCircle2, Play, RefreshCw, Terminal, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LAB_API = '/lab'; // Proxied through Vite to port 5001

export default function XSSLabPage() {
  const [activeTab, setActiveTab] = useState('stored');

  // Stored XSS state
  const [reviewerName, setReviewerName] = useState('Security Tester');
  const [reviewContent, setReviewContent] = useState('<img src=x onerror="document.getElementById(\'stored-xss-badge\').innerText=\'⚠️ XSS Fired!\'; document.getElementById(\'stored-xss-badge\').style.background=\'#ef4444\';">');
  const [storedReviews, setStoredReviews] = useState({ vulnerable: [], secure: [] });
  const [renderMode, setRenderMode] = useState('vulnerable'); // 'vulnerable' | 'secure'

  // Reflected XSS state
  const [searchQuery, setSearchQuery] = useState('<script>alert("Reflected XSS")</script>');
  const [reflectedResult, setReflectedResult] = useState(null);

  // DOM XSS state
  const [domInput, setDomInput] = useState('<img src=x onerror="alert(\'DOM XSS\')">');
  const [domExecution, setDomExecution] = useState({ vulnerable: '', secure: '' });

  // Fetch stored reviews
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${LAB_API}/xss/reviews`);
      setStoredReviews(res.data);
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStoreReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${LAB_API}/xss/store-review`, {
        reviewer_name: reviewerName,
        content: reviewContent,
        rating: 5,
      });
      toast.success('Review stored in database!');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to store review');
    }
  };

  const handleReflectedSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${LAB_API}/xss/reflected?q=${encodeURIComponent(searchQuery)}`);
      setReflectedResult(res.data);
    } catch (err) {
      toast.error('Search test failed');
    }
  };

  return (
    <div className="lab-page" style={{ padding: '36px 20px', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <Code2 size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>Cross-Site Scripting (XSS) Lab</h1>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Explore Stored, Reflected, and DOM-based XSS vulnerabilities and verified sanitization remediations.</p>
          </div>
        </div>

        {/* Lab Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #334155', marginBottom: 28 }}>
          {[
            { id: 'stored', label: '1. Stored XSS (Product Reviews)' },
            { id: 'reflected', label: '2. Reflected XSS (Search Query)' },
            { id: 'dom', label: '3. DOM-based XSS (Client-side Sink)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #ef4444' : '2px solid transparent',
                color: activeTab === tab.id ? '#f87171' : '#94a3b8',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: STORED XSS ────────────────────────────────────────── */}
        {activeTab === 'stored' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Input Form */}
            <div className="lab-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="#ef4444" /> Post Review Payload
              </h3>
              <form onSubmit={handleStoreReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Reviewer Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Review Content (HTML/Script)</label>
                  <textarea
                    rows={4}
                    value={reviewContent}
                    onChange={e => setReviewContent(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setReviewContent('<img src=x onerror="alert(\'Stored XSS!\')">')} style={{ fontSize: 11, padding: '4px 8px', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Payload 1 (img)</button>
                  <button type="button" onClick={() => setReviewContent('<b style="color:red;font-size:18px">Styled Defacement</b>')} style={{ fontSize: 11, padding: '4px 8px', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Payload 2 (HTML)</button>
                </div>
                <button type="submit" className="btn" style={{ background: '#ef4444', color: '#fff', padding: '10px 16px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 8 }}>
                  Submit Stored Review
                </button>
              </form>
            </div>

            {/* Display Comparison */}
            <div className="lab-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Rendered Output</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setRenderMode('vulnerable')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: renderMode === 'vulnerable' ? '#ef4444' : '#334155',
                      color: '#fff'
                    }}
                  >
                    Vulnerable Mode
                  </button>
                  <button
                    onClick={() => setRenderMode('secure')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: renderMode === 'secure' ? '#10b981' : '#334155',
                      color: '#fff'
                    }}
                  >
                    Remediated Mode
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div id="stored-xss-badge" style={{ padding: '8px 12px', background: '#334155', borderRadius: 6, fontSize: 12, marginBottom: 14, fontWeight: 600 }}>
                Status: {renderMode === 'vulnerable' ? '⚠️ dangerouslySetInnerHTML active (Unsafe)' : '🛡️ React Encoded Output (Safe)'}
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(renderMode === 'vulnerable' ? storedReviews.vulnerable : storedReviews.secure)?.map((r, i) => (
                  <div key={i} style={{ padding: 12, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>{r.reviewer_name}</div>
                    {renderMode === 'vulnerable' ? (
                      <div dangerouslySetInnerHTML={{ __html: r.content }} style={{ fontSize: 13 }} />
                    ) : (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{r.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: REFLECTED XSS ──────────────────────────────────────── */}
        {activeTab === 'reflected' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="lab-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Test Search Parameter (GET ?q=...)</h3>
              <form onSubmit={handleReflectedSearch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Search Input</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>
                <button type="submit" className="btn" style={{ background: '#f59e0b', color: '#fff', padding: '10px 16px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Analyze Reflection
                </button>
              </form>
            </div>

            <div className="lab-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Comparison</h3>
              {reflectedResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>VULNERABLE (Raw Reflection)</div>
                    <div style={{ padding: 12, background: '#0f172a', border: '1px solid #ef4444', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}>
                      {reflectedResult.vulnerable}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, marginBottom: 6 }}>SECURED (Sanitized Entity Encoding)</div>
                    <div style={{ padding: 12, background: '#0f172a', border: '1px solid #10b981', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}>
                      {reflectedResult.secure}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: 14 }}>Run a search above to inspect raw vs encoded reflections.</div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: DOM XSS ────────────────────────────────────────────── */}
        {activeTab === 'dom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="lab-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Client-Side Sink Simulation</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Fragment / Hash Payload</label>
                <input
                  type="text"
                  value={domInput}
                  onChange={e => setDomInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDomExecution({ ...domExecution, vulnerable: domInput })}
                  style={{ padding: '10px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Execute with innerHTML (Unsafe)
                </button>
                <button
                  onClick={() => setDomExecution({ ...domExecution, secure: domInput })}
                  style={{ padding: '10px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Execute with textContent (Safe)
                </button>
              </div>
            </div>

            <div className="lab-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>DOM Sink Result</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, marginBottom: 4 }}>element.innerHTML (Executes Tags/Scripts):</div>
                  <div
                    dangerouslySetInnerHTML={{ __html: domExecution.vulnerable || '<em>None executed yet</em>' }}
                    style={{ padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, minHeight: 45 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, marginBottom: 4 }}>element.textContent (Text Only):</div>
                  <div style={{ padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, minHeight: 45 }}>
                    {domExecution.secure || 'None executed yet'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

