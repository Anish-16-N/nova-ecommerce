import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Clock } from 'lucide-react';
import api from '../services/api';

const SESSION_KEY = 'nova_session_id';
const headers = () => ({ 'X-Session-ID': localStorage.getItem(SESSION_KEY)||'' });

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey:['orders'],
    queryFn: ()=>api.get('/orders', { headers:headers() }).then(r=>r.data.data),
  });

  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner"/></div>;

  const orders = data || [];

  return (
    <div className="container" style={{ padding:'40px 24px', maxWidth:760, margin:'0 auto' }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:28 }}>My Orders</h1>
      {orders.length===0 ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <Package size={64} color="var(--color-border-strong)" style={{ margin:'0 auto 20px' }}/>
          <h3 style={{ marginBottom:12 }}>No orders yet</h3>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {orders.map(o=>(
            <Link key={o.id} to={`/orders/${o.id}`} style={{ textDecoration:'none' }}>
              <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:16, transition:'box-shadow 150ms' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
                <div style={{ width:48, height:48, borderRadius:'var(--radius-md)', background:'rgba(99,102,241,.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Package size={22} color="var(--color-primary)"/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{o.order_number}</div>
                  <div style={{ fontSize:13, color:'var(--color-text-muted)', marginTop:2 }}>
                    {o.item_count} item{o.item_count!==1?'s':''} • {new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:700, fontSize:16 }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</div>
                  <StatusBadge status={o.status}/>
                </div>
                <ChevronRight size={16} color="var(--color-text-subtle)"/>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { confirmed:'badge-success', paid:'badge-success', pending:'badge-warning', cancelled:'badge-danger' };
  return <span className={`badge ${map[status]||'badge-primary'}`} style={{ marginTop:4 }}>{status}</span>;
}

