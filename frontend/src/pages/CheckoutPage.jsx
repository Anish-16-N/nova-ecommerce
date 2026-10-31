import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STEPS = ['Delivery', 'Order Summary', 'Payment', 'Confirmation'];
const BANKS = ['SBI','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank','Punjab National Bank','Other Banks'];

function StepIndicator({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:36, justifyContent:'center' }}>
      {STEPS.map((s,i)=>(
        <React.Fragment key={s}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15,
              background: i<step?'var(--color-primary)': i===step?'var(--color-primary)':'var(--color-bg-tertiary)',
              color: i<=step?'#fff':'var(--color-text-muted)',
              border: i===step?'none':'2px solid var(--color-border)',
            }}>
              {i<step ? <CheckCircle size={18}/> : i+1}
            </div>
            <div style={{ fontSize:12, fontWeight:i===step?700:400, color:i===step?'var(--color-primary)':'var(--color-text-muted)', whiteSpace:'nowrap' }}>{s}</div>
          </div>
          {i<STEPS.length-1&&<div style={{ flex:1, height:2, background:i<step?'var(--color-primary)':'var(--color-border)', maxWidth:80, margin:'0 8px', marginBottom:24 }}/>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ full_name:'', email:'', phone:'', address_line1:'', address_line2:'', city:'', state:'', pin_code:'' });
  const [payMethod, setPayMethod] = useState('upi');
  const [upiId, setUpiId]         = useState('');
  const [cardType, setCardType]   = useState('visa');
  const [bank, setBank]           = useState('');
  const [processing, setProcessing]= useState(false);
  const [order, setOrder]         = useState(null);
  const [txn, setTxn]             = useState(null);

  const { items=[], subtotal=0, savings=0, delivery_fee=0, total=0 } = cart;
  const sessionId = localStorage.getItem('nova_session_id');
  const headers   = { 'X-Session-ID': sessionId };

  const placeOrder = async () => {
    setProcessing(true);
    try {
      // 1. Create order
      const orderRes = await api.post('/orders', {
        shipping_address: address,
        payment_method: payMethod,
      }, { headers });
      const ord = orderRes.data.data;
      setOrder(ord);

      // 2. Process payment
      await new Promise(r => setTimeout(r, 2000)); // simulate processing
      const payDetails = payMethod==='upi' ? { upi_id: upiId }
        : payMethod==='card' ? { card_type: cardType }
        : { bank };
      const payRes = await api.post(`/orders/${ord.id}/payment`, {
        payment_method: payMethod,
        payment_details: payDetails,
      }, { headers });
      setTxn(payRes.data.data);
      clearCart();
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container" style={{ padding:'40px 24px', maxWidth:820, margin:'0 auto' }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:32 }}>Checkout</h1>
      <StepIndicator step={step}/>

      <AnimatePresence mode="wait">
        {/* Step 0: Address */}
        {step===0 && (
          <motion.div key="step0" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}>
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ marginBottom:22, display:'flex', alignItems:'center', gap:10 }}><MapPin size={20} color="var(--color-primary)"/> Delivery Address</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[
                  { key:'full_name', label:'Full Name', placeholder:'Rajesh Kumar', full:false },
                  { key:'email',     label:'Email Address', placeholder:'raj@example.com', full:false },
                  { key:'phone',     label:'Phone Number', placeholder:'+91 98765 43210', full:false },
                  { key:'address_line1', label:'Address Line 1', placeholder:'House No., Street Name', full:true },
                  { key:'address_line2', label:'Address Line 2 (Optional)', placeholder:'Landmark, Area', full:true },
                  { key:'city',     label:'City', placeholder:'Mumbai', full:false },
                  { key:'state',    label:'State', placeholder:'Maharashtra', full:false },
                  { key:'pin_code', label:'PIN Code', placeholder:'400001', full:false },
                ].map(f => (
                  <div key={f.key} className="form-group" style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" placeholder={f.placeholder} value={address[f.key]}
                      onChange={e=>setAddress({...address,[f.key]:e.target.value})}/>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" style={{ marginTop:24 }}
                onClick={()=>{
                  if(!address.full_name||!address.email||!address.phone||!address.address_line1||!address.city||!address.state||!address.pin_code){
                    toast.error('Please fill all required fields'); return;
                  }
                  setStep(1);
                }}>
                Continue to Order Summary <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Order Summary */}
        {step===1 && (
          <motion.div key="step1" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}>
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ marginBottom:22, display:'flex', alignItems:'center', gap:10 }}><Package size={20} color="var(--color-primary)"/> Order Summary</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                {items.map(item=>{
                  const disc=parseFloat(item.discount_percentage||0);
                  const fp=Math.round(parseFloat(item.price)*(1-disc/100)*100)/100;
                  return (
                    <div key={item.product_id} style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <img src={item.image_url} alt={item.name} style={{ width:56, height:56, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600 }}>{item.name}</div>
                        <div style={{ fontSize:12, color:'var(--color-text-muted)' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight:700 }}>₹{(fp*item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  );
                })}
              </div>
              <hr style={{ border:'none', borderTop:'1px solid var(--color-border)', marginBottom:16 }}/>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Row2 l="Subtotal" v={`₹${subtotal.toLocaleString('en-IN')}`}/>
                {savings>0&&<Row2 l="Savings" v={`-₹${savings.toLocaleString('en-IN')}`} green/>}
                <Row2 l="Delivery" v={delivery_fee===0?'Free 🎉':`₹${delivery_fee}`}/>
                <hr style={{ border:'none', borderTop:'1px solid var(--color-border)' }}/>
                <Row2 l="Total Payable" v={`₹${total.toLocaleString('en-IN')}`} bold/>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:24 }}>
                <button className="btn btn-ghost" onClick={()=>setStep(0)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={()=>setStep(2)}>Proceed to Payment <ChevronRight size={18}/></button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {step===2 && (
          <motion.div key="step2" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}>
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ marginBottom:22, display:'flex', alignItems:'center', gap:10 }}><CreditCard size={20} color="var(--color-primary)"/> Payment</h3>
              <div style={{ fontSize:12, color:'var(--color-text-muted)', background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', borderRadius:8, padding:'10px 14px', marginBottom:20 }}>
                🔒 This is a demo. No real payment is processed. Do not enter actual card or banking details.
              </div>

              {/* Method tabs */}
              <div className="tabs">
                {['upi','card','netbanking'].map(m=>(
                  <button key={m} className={`tab-btn ${payMethod===m?'active':''}`} onClick={()=>setPayMethod(m)}>
                    {m==='upi'?'UPI':m==='card'?'Credit/Debit Card':'Net Banking'}
                  </button>
                ))}
              </div>

              {payMethod==='upi' && (
                <div style={{ maxWidth:380 }}>
                  <div className="form-group">
                    <label className="form-label">UPI ID</label>
                    <input className="form-input" placeholder="yourname@upi" value={upiId} onChange={e=>setUpiId(e.target.value)}/>
                    <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>Example: 9876543210@paytm</div>
                  </div>
                </div>
              )}

              {payMethod==='card' && (
                <div style={{ maxWidth:440 }}>
                  <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                    {['visa','mastercard','rupay'].map(c=>(
                      <button key={c} onClick={()=>setCardType(c)} style={{ flex:1, padding:'10px 8px', borderRadius:8, border:'2px solid', borderColor:cardType===c?'var(--color-primary)':'var(--color-border)', background:cardType===c?'rgba(99,102,241,.06)':'transparent', cursor:'pointer', fontWeight:600, fontSize:13, transition:'all 150ms' }}>
                        {c.charAt(0).toUpperCase()+c.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#1e293b,#334155)', borderRadius:16, padding:'24px 20px', color:'#fff', marginBottom:16 }}>
                    <div style={{ fontSize:11, opacity:.6, letterSpacing:'.1em', marginBottom:16 }}>DEMO CARD</div>
                    <div style={{ fontFamily:'monospace', fontSize:18, letterSpacing:'.2em', marginBottom:20 }}>•••• •••• •••• ••••</div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, opacity:.7 }}>
                      <div>CARD HOLDER<br/><span style={{ fontSize:14, opacity:1, fontWeight:600 }}>Demo User</span></div>
                      <div style={{ textAlign:'right' }}>EXPIRES<br/><span style={{ fontSize:14, opacity:1, fontWeight:600 }}>MM/YY</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'var(--color-text-muted)', textAlign:'center' }}>This is a demo checkout — no real card details required</div>
                </div>
              )}

              {payMethod==='netbanking' && (
                <div style={{ maxWidth:400 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                    {BANKS.map(b=>(
                      <button key={b} onClick={()=>setBank(b)} style={{ padding:'12px 8px', borderRadius:8, border:'2px solid', borderColor:bank===b?'var(--color-primary)':'var(--color-border)', background:bank===b?'rgba(99,102,241,.06)':'transparent', cursor:'pointer', fontSize:13, fontWeight:bank===b?600:400, transition:'all 150ms' }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:24, alignItems:'center' }}>
                <button className="btn btn-ghost" onClick={()=>setStep(1)} disabled={processing}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={processing}
                  style={{ minWidth:200, position:'relative' }}>
                  {processing ? (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}><div className="spinner" style={{ width:18, height:18, borderWidth:2 }}/> Processing...</span>
                  ) : `Pay ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step===3 && order && (
          <motion.div key="step3" initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ type:'spring', stiffness:200 }}>
            <div className="card" style={{ padding:40, textAlign:'center' }}>
              <motion.div animate={{ scale:[1,1.2,1] }} transition={{ duration:.5 }}>
                <CheckCircle size={72} color="var(--color-success)" style={{ margin:'0 auto 20px' }}/>
              </motion.div>
              <h2 style={{ fontSize:28, fontWeight:800, color:'var(--color-success)', marginBottom:8 }}>Order Placed! 🎉</h2>
              <p style={{ color:'var(--color-text-muted)', marginBottom:32 }}>
                Thank you for shopping with NOVA! Your order has been confirmed.
              </p>
              <div style={{ background:'var(--color-bg-secondary)', borderRadius:'var(--radius-lg)', padding:24, maxWidth:400, margin:'0 auto 32px', textAlign:'left' }}>
                <Row2 l="Order Number" v={order.order_number} bold/>
                <Row2 l="Payment" v={txn?.status==='success'?'✅ Successful':'❌ Failed'}/>
                <Row2 l="Method" v={payMethod.toUpperCase()}/>
                {txn?.transaction_id&&<Row2 l="Transaction ID" v={txn.transaction_id}/>}
                <Row2 l="Estimated Delivery" v={order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '5-7 business days'}/>
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <Link to="/orders" className="btn btn-primary">View My Orders</Link>
                <Link to="/" className="btn btn-ghost">Continue Shopping</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row2({ l, v, green, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, padding:'5px 0', fontWeight:bold?700:400, color:green?'var(--color-success)':'var(--color-text)' }}>
      <span style={{ color:'var(--color-text-muted)', fontWeight:400 }}>{l}</span><span>{v}</span>
    </div>
  );
}

