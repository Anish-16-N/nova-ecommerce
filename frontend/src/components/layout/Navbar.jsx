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
  const { cart } = useCart();
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

  const cartCount = cart?.count || 0;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      transition: 'box-shadow 200ms',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', height:64, gap:16 }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            fontWeight:900, fontSize:24, letterSpacing:'-.04em',
          }}>NOVA</span>
        </Link>

        {!minimal && (
          <>
            <nav style={{ display:'flex', alignItems:'center', gap:2, marginLeft:8 }}>
              <NavLink to="/">Home</NavLink>
              <div style={{ position:'relative' }}
                onMouseEnter={()=>setCatOpen(true)} onMouseLeave={()=>setCatOpen(false)}>
                <button className="btn btn-ghost btn-sm" style={{ display:'flex', gap:4, alignItems:'center' }}>
                  Categories <ChevronDown size={13} style={{ transform:catOpen?'rotate(180deg)':'none', transition:'transform 200ms' }} />
                </button>
                <AnimatePresence>
                  {catOpen && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                      transition={{ duration:.14 }}
                      style={{ position:'absolute', top:'100%', left:0, zIndex:200, background:'#fff',
                        border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)',
                        boxShadow:'var(--shadow-lg)', padding:8, minWidth:200, marginTop:4 }}>
                      {CATEGORIES.map(c => (
                        <Link key={c.slug} to={`/category/${c.slug}`} onClick={()=>setCatOpen(false)}
                          style={{ display:'block', padding:'9px 14px', borderRadius:'var(--radius-md)',
                            fontSize:14, fontWeight:500, color:'var(--color-text)',
                            transition:'background 120ms' }}
                          onMouseEnter={e=>e.target.style.background='var(--color-bg-tertiary)'}
                          onMouseLeave={e=>e.target.style.background='transparent'}>
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

            <form onSubmit={handleSearch} style={{ flex:1, maxWidth:380, margin:'0 8px' }}>
              <div style={{ position:'relative' }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }} />
                <input type="search" placeholder="Search products, brands..." value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  className="form-input" style={{ paddingLeft:38, borderRadius:'var(--radius-full)', background:'var(--color-bg-secondary)' }} />
              </div>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:2, marginLeft:'auto' }}>
              <Link to="/wishlist"><IconBtn title="Wishlist"><Heart size={19}/></IconBtn></Link>

              <Link to="/cart" style={{ position:'relative' }}>
                <IconBtn title="Cart"><ShoppingCart size={19}/>
                  {cartCount>0 && <span style={{
                    position:'absolute', top:-5, right:-5, background:'var(--color-primary)', color:'#fff',
                    borderRadius:'99px', fontSize:10, fontWeight:700, minWidth:18, height:18,
                    display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px',
                  }}>{cartCount>99?'99+':cartCount}</span>}
                </IconBtn>
              </Link>

              <div style={{ position:'relative' }}
                onMouseEnter={()=>setUserOpen(true)} onMouseLeave={()=>setUserOpen(false)}>
                <IconBtn title="Account"><User size={19}/></IconBtn>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                      transition={{ duration:.14 }}
                      style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:200, background:'#fff',
                        border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)',
                        boxShadow:'var(--shadow-lg)', padding:8, minWidth:180 }}>
                      {user ? (
                        <>
                          <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid var(--color-border)', marginBottom:4 }}>
                            <div style={{ fontSize:14, fontWeight:600 }}>{user.full_name||user.username}</div>
                            <div style={{ fontSize:12, color:'var(--color-text-muted)' }}>{user.email}</div>
                          </div>
                          <DropLink to="/profile">My Profile</DropLink>
                          <DropLink to="/orders">My Orders</DropLink>
                          <DropLink to="/wishlist">Wishlist</DropLink>
                          <hr style={{ border:'none', borderTop:'1px solid var(--color-border)', margin:'4px 0' }}/>
                          <button onClick={logout} style={{ display:'block', width:'100%', textAlign:'left',
                            padding:'9px 14px', borderRadius:'var(--radius-md)', fontSize:14, color:'var(--color-error)',
                            background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>Sign Out</button>
                        </>
                      ) : (
                        <>
                          <DropLink to="/login">Sign In</DropLink>
                          <DropLink to="/register">Create Account</DropLink>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/security-lab" style={{ marginLeft:6 }}>
                <button style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)',
                  borderRadius:'var(--radius-md)', fontSize:11, fontWeight:700, color:'#ef4444', cursor:'pointer' }}>
                  <Zap size={11}/> LAB
                </button>
              </Link>
            </div>
          </>
        )}

        {minimal && <Link to="/" style={{ marginLeft:'auto', fontSize:13, color:'var(--color-primary)', fontWeight:600 }}>← Back to Store</Link>}
      </div>
    </header>
  );
}

function NavLink({ to, children }) {
  return <Link to={to} className="btn btn-ghost btn-sm">{children}</Link>;
}
function IconBtn({ children, title }) {
  return <button title={title} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:'var(--radius-md)', color:'var(--color-text-muted)', background:'transparent', border:'none', cursor:'pointer', position:'relative' }}
    onMouseEnter={e=>{e.currentTarget.style.background='var(--color-bg-tertiary)';e.currentTarget.style.color='var(--color-text)';}}
    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--color-text-muted)';}}
  >{children}</button>;
}
function DropLink({ to, children }) {
  return <Link to={to} style={{ display:'block', padding:'9px 14px', borderRadius:'var(--radius-md)', fontSize:14, fontWeight:500, color:'var(--color-text)', transition:'background 120ms' }}
    onMouseEnter={e=>e.target.style.background='var(--color-bg-tertiary)'}
    onMouseLeave={e=>e.target.style.background='transparent'}>{children}</Link>;
}
