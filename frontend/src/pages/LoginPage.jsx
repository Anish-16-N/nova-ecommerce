import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { name: 'Rajesh Kumar (Mumbai)', email: 'rajesh.kumar@example.com', role: 'Premium Buyer' },
  { name: 'Priya Sharma (Gurugram)', email: 'priya.sharma@example.com', role: 'Verified Customer' },
  { name: 'Amitav Sengupta (Kolkata)', email: 'amitav.sengupta@example.com', role: 'Customer' },
  { name: 'Ananya Iyer (Bengaluru)', email: 'ananya.iyer@example.com', role: 'Tech Enthusiast' },
  { name: 'Vikramaditya Rathore (Jaipur)', email: 'vikram.rathore@example.com', role: 'Loyal Shopper' },
  { name: 'Sneha Reddy (Hyderabad)', email: 'sneha.reddy@example.com', role: 'Customer' },
  { name: 'Rohan Mehta (Ahmedabad)', email: 'rohan.mehta@example.com', role: 'Frequent Shopper' },
  { name: 'Neha Kapoor (New Delhi)', email: 'neha.kapoor@example.com', role: 'Beauty & Fashion' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email_or_username: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoList, setShowDemoList] = useState(false);

  const fillAccount = (email) => {
    setForm({ email_or_username: email, password: 'Password123!' });
    toast.success(`Selected ${email}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email_or_username || !form.password) {
      toast.error('Please enter email/username and password');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back to NOVA!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card"
        style={{ width: '100%', maxWidth: 460, padding: '36px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            fontSize: 28,
            display: 'block',
            marginBottom: 6,
          }}>
            NOVA
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>
            Sign in to access your orders, cart, and profile
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                type="text"
                placeholder="your@email.com or username"
                value={form.email_or_username}
                onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                type={show ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-subtle)' }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Customer Profiles Box */}
        <div style={{ marginTop: 24, padding: 14, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setShowDemoList(!showDemoList)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
              <Users size={16} color="var(--color-primary)" />
              <span>Pre-seeded Customer Accounts (22 Total)</span>
            </div>
            {showDemoList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 0 }}>
            Click any account below to auto-fill credentials (Password: <code>Password123!</code>):
          </p>

          {showDemoList && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillAccount(acc.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: '#1e1e38',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12,
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{acc.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>{acc.email}</div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Auto-fill</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
