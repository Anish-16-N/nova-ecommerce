import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner"/></div>;

  const { items=[], subtotal=0, savings=0, delivery_fee=0, total=0 } = cart;

  if (items.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'100px 24px' }}>
        <motion.div initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:200 }}>
          <ShoppingBag size={72} color="var(--color-border-strong)" style={{ margin:'0 auto 24px' }}/>
        </motion.div>
        <h2 style={{ fontSize:24, fontWeight:700, marginBottom:10 }}>Your cart is empty</h2>
        <p style={{ color:'var(--color-text-muted)', marginBottom:32 }}>Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-primary btn-lg">Start Shopping <ArrowRight size={18}/></Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding:'40px 24px' }}>
      <h1 style={{ fontSize:28, fontWeight:800, marginBottom:32 }}>Shopping Cart <span style={{ fontSize:18, fontWeight:500, color:'var(--color-text-muted)' }}>({items.length} items)</span></h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:32, alignItems:'flex-start' }}>
        {/* Items */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <AnimatePresence initial={false}>
            {items.map(item => {
              const disc = parseFloat(item.discount_percentage||0);
              const finalPrice = Math.round(parseFloat(item.price)*(1-disc/100)*100)/100;
              return (
                <motion.div key={item.product_id} layout
                  initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
                  className="card" style={{ display:'flex', gap:16, padding:16, alignItems:'center' }}>
                  <img src={item.image_url||'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                    alt={item.name} style={{ width:88, height:88, objectFit:'cover', borderRadius:'var(--radius-md)', flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, color:'var(--color-text-subtle)', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>{item.brand}</div>
                    <div style={{ fontSize:15, fontWeight:600, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span className="price-current">₹{finalPrice.toLocaleString('en-IN')}</span>
                      {disc>0&&<span className="price-original">₹{parseFloat(item.price).toLocaleString('en-IN')}</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid var(--color-border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                        <button onClick={()=>item.quantity>1?updateQuantity({product_id:item.product_id,quantity:item.quantity-1}):removeFromCart(item.product_id)}
                          style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)' }}><Minus size={14}/></button>
                        <span style={{ minWidth:32, textAlign:'center', fontSize:14, fontWeight:600 }}>{item.quantity}</span>
                        <button onClick={()=>updateQuantity({product_id:item.product_id,quantity:item.quantity+1})}
                          style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)' }}><Plus size={14}/></button>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:15, fontWeight:700 }}>₹{(finalPrice*item.quantity).toLocaleString('en-IN')}</span>
                        <button onClick={()=>removeFromCart(item.product_id)} style={{ padding:6, borderRadius:'var(--radius-md)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-subtle)' }}
                          onMouseEnter={e=>e.currentTarget.style.color='var(--color-error)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--color-text-subtle)'}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="card" style={{ padding:24, position:'sticky', top:80 }}>
          <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Order Summary</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Row label="Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`}/>
            {savings>0&&<Row label="You save" value={`-₹${savings.toLocaleString('en-IN')}`} green/>}
            <Row label="Delivery" value={delivery_fee===0?'Free':`₹${delivery_fee}`}/>
            {delivery_fee>0&&<div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:-8 }}>Add ₹{(999-subtotal).toFixed(0)} more for free delivery</div>}
            <hr style={{ border:'none', borderTop:'1px solid var(--color-border)', margin:'4px 0' }}/>
            <Row label="Total" value={`₹${total.toLocaleString('en-IN')}`} bold/>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:20 }} onClick={()=>navigate('/checkout')}>
            Proceed to Checkout <ArrowRight size={18}/>
          </button>
          <Link to="/products" style={{ display:'block', textAlign:'center', marginTop:14, fontSize:13, color:'var(--color-text-muted)' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, green, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:bold?700:400, color:green?'var(--color-success)':bold?'var(--color-text)':'var(--color-text-muted)' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

