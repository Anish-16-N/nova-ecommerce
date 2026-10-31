import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) { navigate('/login'); return null; }
  return (
    <div className="container" style={{ padding:'40px 24px', maxWidth:540, margin:'0 auto' }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:28 }}>My Profile</h1>
      <div className="card" style={{ padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', fontWeight:700 }}>
            {(user.full_name||user.username||'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:18 }}>{user.full_name||user.username}</div>
            <div style={{ color:'var(--color-text-muted)', fontSize:14 }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['Username', user.username],
            ['Email', user.email],
            ['Full Name', user.full_name||'—'],
            ['Phone', user.phone||'—'],
            ['Member since', new Date(user.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--color-border)', fontSize:14 }}>
              <span style={{ color:'var(--color-text-muted)', fontWeight:500 }}>{l}</span>
              <span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-danger" style={{ width:'100%', marginTop:24 }} onClick={()=>{ logout(); navigate('/'); }}>Sign Out</button>
      </div>
    </div>
  );
}

