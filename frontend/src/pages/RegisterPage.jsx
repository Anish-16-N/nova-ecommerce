import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name:'', username:'', email:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email||!form.username||!form.password) { toast.error('Please fill all required fields'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to NOVA!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg-secondary)', padding:24 }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.35 }}
        className="card" style={{ width:'100%', maxWidth:440, padding:'40px 36px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:900, fontSize:28, display:'block', marginBottom:8 }}>NOVA</span>
          <h2 style={{ fontSize:22, fontWeight:700 }}>Create your account</h2>
          <p style={{ color:'var(--color-text-muted)', marginTop:4, fontSize:14 }}>Join millions of happy shoppers</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'full_name', label:'Full Name', type:'text', placeholder:'Rajesh Kumar', icon:<User size={16}/>, required:false },
            { key:'username',  label:'Username',  type:'text', placeholder:'rajesh_k', icon:<User size={16}/>, required:true },
            { key:'email',     label:'Email', type:'email', placeholder:'raj@example.com', icon:<Mail size={16}/>, required:true },
          ].map(f=>(
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}{f.required&&<span style={{ color:'var(--color-error)' }}>*</span>}</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}>{f.icon}</span>
                <input className="form-input" style={{ paddingLeft:38 }} type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required={f.required}/>
              </div>
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Password<span style={{ color:'var(--color-error)' }}>*</span></label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}/>
              <input className="form-input" style={{ paddingLeft:38, paddingRight:40 }} type={show?'text':'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
              <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-subtle)' }}>
                {show?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:6 }} disabled={loading}>
            {loading?<><div className="spinner" style={{ width:18,height:18,borderWidth:2 }}/> Creating account...</>:'Create Account'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--color-primary)', fontWeight:600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

