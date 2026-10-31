import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, User, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

const CATEGORIES = [
  { name: 'Electronics',     slug: 'electronics'    },
  { name: 'Fashion',         slug: 'fashion'        },
  { name: 'Home & Living',   slug: 'home-living'    },
  { name: 'Beauty',          slug: 'beauty'         },
  { name: 'Accessories',     slug: 'accessories'    },
  { name: 'Sports & Fitness',slug: 'sports-fitness' },
];

export default function Navbar({ minimal = false }) {
  const { user, logout } = useAuth();
  const { cart, itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrolled,   setScrolled]   = useState(false);
  const [catOpen,    setCatOpen]    = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [searchQuery,setSearchQuery]= useState(searchParams.get('search') || '');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const cartCount = itemCount || cart?.count || cart?.items?.length || 0;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(22, 22, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.5)' : 'none',
      transition: 'box-shadow 200ms',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', height:68, gap:16 }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            fontWeight:900, fontSize:25, letterSpacing:'-.04em',
          }}>NOVA</span>
        </Link>

        {!minimal && (
          <>
            <nav style={{ display:'flex', alignItems:'center', gap:4, marginLeft:8 }}>
              <NavLink to="/">Home</NavLink>
              <div style={{ position:'relative' }}
                onMouseEnter={()=>setCatOpen(true)} onMouseLeave={()=>setCatOpen(false)}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display:'flex', gap:4, alignItems:'center', color:'#e2e8f0', fontWeight:500 }}
                >
                  Categories <ChevronDown size={13} style={{ transform:catOpen?'rotate(180deg)':'none', transition:'transform 200ms' }} />
                </button>
                <AnimatePresence>
                  {catOpen && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                      transition={{ duration:.14 }}
                      style={{
                        position:'absolute', top:'100%', left:0, zIndex:200,
                        background:'#1e1e38',
                        border:'1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius:'var(--radius-lg)',
                        boxShadow:'0 12px 40px rgba(0, 0, 0, 0.6)',
                        padding:8, minWidth:200, marginTop:4
                      }}>
                      {CATEGORIES.map(c => (
                        <Link key={c.slug} to={`/category/${c.slug}`} onClick={()=>setCatOpen(false)}
                          style={{
                            display:'block', padding:'9px 14px', borderRadius:'var(--radius-md)',
                            fontSize:14, fontWeight:500, color:'#f1f5f9',
                            transition:'background 120ms'
                          }}
                          onMouseEnter={e=>{ e.target.style.background='rgba(99, 102, 241, 0.18)'; e.target.style.color='#ffffff'; }}
                          onMouseLeave={e=>{ e.target.style.background='transparent'; e.target.style.color='#f1f5f9'; }}>
                          {c.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <NavLink to="/products?sort=popular">Deals</NavLink>
              <NavLink to="/products?sort=newest">New Arrivals</NavLink>
            </nav>

            <form onSubmit={handleSearch} style={{ flex:1, maxWidth:420, margin:'0 12px' }}>
              <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                <Search size={15} style={{ position:'absolute', left:14, color:'#818cf8', pointerEvents:'none' }} />
                <input
                  type="search"
                  placeholder="Search 37 products, brands, or categories..."
                  value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 40px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(22, 22, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                    transition: 'all 200ms ease',
                  }}
                  onFocus={e=>{
                    e.target.style.borderColor='#818cf8';
                    e.target.style.boxShadow='0 0 16px rgba(99, 102, 241, 0.35), inset 0 2px 4px rgba(0,0,0,0.4)';
                  }}
                  onBlur={e=>{
                    e.target.style.borderColor='rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow='inset 0 2px 4px rgba(0, 0, 0, 0.4)';
                  }}
                />
                <span style={{ position:'absolute', right:12, fontSize:10, fontWeight:700, color:'#64748b', background:'rgba(255, 255, 255, 0.08)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(255,255,255,0.06)' }}>/</span>
              </div>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
              <Link to="/wishlist"><IconBtn title="Wishlist"><Heart size={19}/></IconBtn></Link>

              <Link
                to="/cart"
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  padding: '7px 14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  borderColor: cartCount > 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.15)',
                  color: cartCount > 0 ? '#ffffff' : '#e2e8f0',
                  background: cartCount > 0 ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <ShoppingCart size={17} color={cartCount > 0 ? '#818cf8' : '#cbd5e1'} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '99px',
                      fontSize: 11,
                      fontWeight: 800,
                      minWidth: 20,
                      height: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div style={{ position:'relative' }}
                  onMouseEnter={()=>setUserOpen(true)} onMouseLeave={()=>setUserOpen(false)}>
                  <button
                    className="btn btn-sm"
                    style={{
                      display:'flex', gap:7, alignItems:'center',
                      padding:'7px 12px',
                      background:'rgba(99, 102, 241, 0.15)',
                      border:'1px solid rgba(99, 102, 241, 0.35)',
                      borderRadius:'var(--radius-full)',
                      color:'#ffffff',
                    }}
                  >
                    <User size={15} color="#818cf8" />
                    <span style={{ fontWeight:700, fontSize:13, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {user.full_name?.split(' ')[0] || user.username}
                    </span>
                    <ChevronDown size={13} color="#94a3b8" />
                  </button>
                  <AnimatePresence>
                    {userOpen && (
                      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                        transition={{ duration:.14 }}
                        className="user-dropdown-menu"
                        style={{
                          position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:200,
                          background:'#1e1e38',
                          backgroundColor:'#1e1e38',
                          border:'1px solid rgba(255, 255, 255, 0.16)',
                          borderRadius:'var(--radius-lg)',
                          boxShadow:'0 16px 48px rgba(0, 0, 0, 0.7)',
                          padding:8, minWidth:210
                        }}>
                        <div style={{ padding:'10px 14px 10px', borderBottom:'1px solid rgba(255, 255, 255, 0.08)', marginBottom:6 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#ffffff' }}>{user.full_name||user.username}</div>
                          <div style={{ fontSize:12, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
                        </div>
                        <DropLink to="/profile">My Profile</DropLink>
                        <DropLink to="/orders">My Orders</DropLink>
                        <DropLink to="/wishlist">Wishlist</DropLink>
                        <hr style={{ border:'none', borderTop:'1px solid rgba(255, 255, 255, 0.08)', margin:'6px 0' }}/>
                        <button
                          onClick={logout}
                          style={{
                            display:'block', width:'100%', textAlign:'left',
                            padding:'9px 14px', borderRadius:'var(--radius-md)', fontSize:13,
                            color:'#f87171', background:'none', border:'none', cursor:'pointer', fontWeight:600,
                            transition:'background 120ms'
                          }}
                          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239, 68, 68, 0.12)'; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; }}
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontWeight:600, color:'#e2e8f0' }}>Sign In</Link>
                  <Link to="/register" className="btn btn-primary btn-sm" style={{ fontWeight:700, padding:'7px 16px' }}>Sign Up</Link>
                </div>
              )}

              <Link to="/security-lab" style={{ marginLeft:4, textDecoration:'none' }}>
                <button style={{
                  display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                  background:'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.35))',
                  border:'1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius:'var(--radius-full)', fontSize:12, fontWeight:800, color:'#fca5a5', cursor:'pointer',
                  boxShadow:'0 0 16px rgba(239, 68, 68, 0.3)',
                  letterSpacing:'.04em',
                  transition: 'all 150ms'
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(220, 38, 38, 0.5))';
                  e.currentTarget.style.boxShadow='0 0 24px rgba(239, 68, 68, 0.6)';
                  e.currentTarget.style.transform='translateY(-1px)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.35))';
                  e.currentTarget.style.boxShadow='0 0 16px rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform='translateY(0)';
                }}
                >
                  <Zap size={14} fill="#ef4444" color="#ef4444"/> LAB
                </button>
              </Link>
            </div>
          </>
        )}

        {minimal && <Link to="/" style={{ marginLeft:'auto', fontSize:13, color:'var(--primary-light)', fontWeight:600 }}>← Back to Store</Link>}
      </div>
    </header>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} className="btn btn-ghost btn-sm" style={{ color:'#e2e8f0', fontWeight:500 }}>
      {children}
    </Link>
  );
}

function IconBtn({ children, title }) {
  return (
    <button
      title={title}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width:38, height:38, borderRadius:'var(--radius-md)',
        color:'#cbd5e1', background:'transparent', border:'none', cursor:'pointer', position:'relative',
        transition:'all 150ms'
      }}
      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color='#ffffff'; }}
      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#cbd5e1'; }}
    >
      {children}
    </button>
  );
}

function DropLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        display:'block', padding:'9px 14px', borderRadius:'var(--radius-md)',
        fontSize:14, fontWeight:500, color:'#f1f5f9', transition:'all 120ms', textDecoration:'none'
      }}
      onMouseEnter={e=>{ e.target.style.background='rgba(99, 102, 241, 0.18)'; e.target.style.color='#ffffff'; }}
      onMouseLeave={e=>{ e.target.style.background='transparent'; e.target.style.color='#f1f5f9'; }}
    >
      {children}
    </Link>
  );
}
