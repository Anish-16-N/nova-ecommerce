import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email_or_username:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email_or_username || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg-secondary)', padding:24 }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.35 }}
        className="card" style={{ width:'100%', maxWidth:420, padding:'40px 36px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:900, fontSize:28, display:'block', marginBottom:8 }}>NOVA</span>
          <h2 style={{ fontSize:22, fontWeight:700 }}>Welcome back</h2>
          <p style={{ color:'var(--color-text-muted)', marginTop:4, fontSize:14 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}/>
              <input className="form-input" style={{ paddingLeft:38 }} type="text" placeholder="your@email.com"
                value={form.email_or_username} onChange={e=>setForm({...form, email_or_username:e.target.value})}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}/>
              <input className="form-input" style={{ paddingLeft:38, paddingRight:40 }} type={show?'text':'password'} placeholder="Your password"
                value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
              <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-subtle)' }}>
                {show?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:4 }} disabled={loading}>
            {loading?<><div className="spinner" style={{ width:18,height:18,borderWidth:2 }}/> Signing in...</>:'Sign In'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color:'var(--color-primary)', fontWeight:600 }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}

