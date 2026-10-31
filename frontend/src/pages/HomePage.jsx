import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones, Cpu, Shirt, Home, Sparkles, Watch, Dumbbell } from 'lucide-react';
import api from '../services/api';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';

const CATEGORY_ICONS = {
  electronics: Cpu, fashion: Shirt, 'home-living': Home,
  beauty: Sparkles, accessories: Watch, 'sports-fitness': Dumbbell,
};

const fadeUp = { initial:{ opacity:0, y:24 }, animate:{ opacity:1, y:0 }, transition:{ duration:.4 } };
const stagger = { animate:{ transition:{ staggerChildren:.07 } } };

function SectionHeader({ title, subtitle, linkTo, linkLabel = 'View All' }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle" style={{ marginBottom:0 }}>{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="btn btn-ghost btn-sm" style={{ gap:6, flexShrink:0 }}>
          {linkLabel} <ArrowRight size={14}/>
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ data, isLoading, count=8 }) {
  return (
    <motion.div className="products-grid" variants={stagger} initial="initial" animate="animate">
      {isLoading
        ? Array.from({ length: count }).map((_,i) => <ProductCardSkeleton key={i}/>)
        : (data||[]).slice(0,count).map((p,i) => <ProductCard key={p.id} product={p} index={i}/>)
      }
    </motion.div>
  );
}

export default function HomePage() {
  const { data: featured,    isLoading: loadFeat }  = useQuery({ queryKey:['products-featured'],    queryFn:()=>api.get('/products/featured?limit=8').then(r=>r.data.data) });
  const { data: bestSellers, isLoading: loadBest }  = useQuery({ queryKey:['products-bestsellers'], queryFn:()=>api.get('/products/best-sellers?limit=8').then(r=>r.data.data) });
  const { data: newArrivals, isLoading: loadNew }   = useQuery({ queryKey:['products-newarrivals'], queryFn:()=>api.get('/products/new-arrivals?limit=8').then(r=>r.data.data) });
  const { data: categories,  isLoading: loadCats }  = useQuery({ queryKey:['categories'],           queryFn:()=>api.get('/products/categories').then(r=>r.data.data) });

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        background:'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        color:'#fff', padding:'80px 0 60px', position:'relative', overflow:'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position:'absolute', top:-100, right:-100, width:500, height:500,
          background:'radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400,
          background:'radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
            <motion.div {...fadeUp}>
              <div className="badge badge-primary" style={{ marginBottom:20, background:'rgba(99,102,241,.2)', color:'#a5b4fc' }}>
                🎉 New Arrivals — Up to 40% Off
              </div>
              <h1 style={{ color:'#fff', marginBottom:16, fontSize:'clamp(2.2rem,4vw,3.2rem)' }}>
                Everything You Need.<br/>
                <span style={{ background:'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>One Destination.</span>
              </h1>
              <p style={{ fontSize:17, color:'#94a3b8', lineHeight:1.7, marginBottom:32, maxWidth:440 }}>
                Discover millions of products from top brands. Premium quality, unbeatable prices, and lightning-fast delivery right to your door.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/products" className="btn btn-primary btn-lg">
                  Shop Now <ArrowRight size={18}/>
                </Link>
                <Link to="/products?sort=popular" className="btn" style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.2)', padding:'13px 28px', borderRadius:'var(--radius-md)', fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  Today's Deals
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:.5, delay:.15 }}
              style={{ display:'flex', justifyContent:'center' }}>
              <div style={{ position:'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
                  alt="Premium Shopping"
                  style={{ width:'100%', maxWidth:460, borderRadius:'var(--radius-xl)', boxShadow:'0 32px 80px rgba(0,0,0,.5)', objectFit:'cover', aspectRatio:'4/3' }}
                />
                {/* Floating badge */}
                <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                  style={{ position:'absolute', bottom:24, left:-20, background:'rgba(30, 30, 56, 0.95)', backdropFilter:'blur(12px)', border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:'var(--radius-lg)', padding:'12px 18px', boxShadow:'0 16px 40px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:24 }}>🛍️</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#ffffff' }}>50,000+ Products</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>Curated for you</div>
                  </div>
                </motion.div>
                <motion.div animate={{ y:[0,8,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut', delay:.5 }}
                  style={{ position:'absolute', top:24, right:-20, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'var(--radius-lg)', padding:'12px 18px', boxShadow:'var(--shadow-xl)', color:'#fff' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>Free Delivery</div>
                  <div style={{ fontSize:11, opacity:.8 }}>Above ₹999</div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Trust bar */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3, duration:.4 }}
            style={{ display:'flex', flexWrap:'wrap', gap:24, marginTop:52, paddingTop:40, borderTop:'1px solid rgba(255,255,255,.1)' }}>
            {[
              { icon:<Truck size={18}/>, text:'Free delivery on ₹999+' },
              { icon:<RotateCcw size={18}/>, text:'30-day easy returns' },
              { icon:<Shield size={18}/>, text:'100% secure checkout' },
              { icon:<Headphones size={18}/>, text:'24/7 customer support' },
            ].map(t => (
              <div key={t.text} style={{ display:'flex', alignItems:'center', gap:10, color:'#94a3b8', fontSize:14, fontWeight:500 }}>
                <span style={{ color:'#818cf8' }}>{t.icon}</span>{t.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────────────── */}
      <section className="section-sm" style={{ background:'var(--bg-surface)', borderBottom:'1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="container">
          <SectionHeader title="Shop by Category" subtitle="Find exactly what you're looking for" linkTo="/products" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:14 }}>
            {loadCats
              ? Array.from({length:6}).map((_,i)=><div key={i} className="skeleton" style={{height:120,borderRadius:'var(--radius-lg)'}}/>)
              : (categories||[]).map((cat,i)=>{
                  const Icon = CATEGORY_ICONS[cat.slug] || Cpu;
                  return (
                    <motion.div key={cat.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.06,duration:.35}} whileHover={{y:-4,scale:1.02}}>
                      <Link
                        to={`/category/${cat.slug}`}
                        style={{
                          display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                          padding:'22px 14px', borderRadius:'var(--radius-lg)',
                          background:'var(--bg-elevated)',
                          border:'1px solid rgba(255, 255, 255, 0.08)',
                          textAlign:'center', textDecoration:'none', transition:'all 200ms',
                          boxShadow:'0 4px 16px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={e=>{
                          e.currentTarget.style.borderColor='rgba(99, 102, 241, 0.5)';
                          e.currentTarget.style.background='#252548';
                          e.currentTarget.style.boxShadow='0 8px 30px rgba(99, 102, 241, 0.25)';
                        }}
                        onMouseLeave={e=>{
                          e.currentTarget.style.borderColor='rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background='var(--bg-elevated)';
                          e.currentTarget.style.boxShadow='0 4px 16px rgba(0, 0, 0, 0.3)';
                        }}
                      >
                        <div style={{ width:48, height:48, borderRadius:'14px', background:'rgba(99, 102, 241, 0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon size={24} color="#818cf8"/>
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color:'#ffffff', letterSpacing:'-0.01em' }}>{cat.name}</span>
                        <span style={{ fontSize:12, fontWeight:500, color:'#94a3b8' }}>{cat.product_count} items</span>
                      </Link>
                    </motion.div>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ─── Featured/Trending ─────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <SectionHeader title="Trending Products" subtitle="What everyone's buying right now" linkTo="/products?sort=popular" />
          <ProductGrid data={featured} isLoading={loadFeat} count={8}/>
        </div>
      </section>

      {/* ─── Promo Banner ──────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)', padding:'56px 0' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
          <div style={{ color:'#fff' }}>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', opacity:.8, marginBottom:8 }}>Limited Time Offer</div>
            <h2 style={{ fontSize:'clamp(1.8rem,3vw,2.5rem)', fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>Up to 40% Off on Electronics</h2>
            <p style={{ fontSize:16, opacity:.9 }}>Top brands, best prices. Don't miss out — offer ends soon!</p>
          </div>
          <Link to="/category/electronics" className="btn btn-lg" style={{ background:'#fff', color:'#ef4444', fontWeight:700, flexShrink:0 }}>
            Shop Electronics <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {/* ─── Best Sellers ──────────────────────────────────────────────── */}
      <section className="section" style={{ background:'var(--color-bg-secondary)' }}>
        <div className="container">
          <SectionHeader title="Best Sellers" subtitle="Customer favourites, month after month" linkTo="/products?sort=popular" />
          <ProductGrid data={bestSellers} isLoading={loadBest} count={8}/>
        </div>
      </section>

      {/* ─── New Arrivals ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <SectionHeader title="New Arrivals" subtitle="Fresh drops, just landed" linkTo="/products?sort=newest" />
          <ProductGrid data={newArrivals} isLoading={loadNew} count={8}/>
        </div>
      </section>
    </div>
  );
}

