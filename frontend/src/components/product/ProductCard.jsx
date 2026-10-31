import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} fill={i<=Math.round(rating)?'#fbbf24':'none'} color={i<=Math.round(rating)?'#fbbf24':'#d1d5db'}/>
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card" style={{ overflow:'hidden' }}>
      <div className="skeleton" style={{ height:240 }}/>
      <div style={{ padding:14 }}>
        <div className="skeleton" style={{ height:12, width:'40%', marginBottom:10 }}/>
        <div className="skeleton" style={{ height:16, marginBottom:6 }}/>
        <div className="skeleton" style={{ height:14, width:'70%', marginBottom:12 }}/>
        <div className="skeleton" style={{ height:36 }}/>
      </div>
    </div>
  );
}

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!product) return <ProductCardSkeleton />;

  const discount = parseFloat(product.discount_percentage || 0);
  const finalPrice = discount > 0
    ? Math.round(parseFloat(product.price) * (1 - discount/100))
    : parseFloat(product.price);
  const originalPrice = parseFloat(product.compare_price || product.price);

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.35, delay: Math.min(index * .05, .3) }}
      className="card"
      style={{
        overflow:'hidden',
        display:'flex',
        flexDirection:'column',
        position:'relative',
        background: '#16162a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      whileHover={{ y:-5 }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div style={{ position:'absolute', top:12, left:12, zIndex:2,
          background:'linear-gradient(135deg,#ef4444,#dc2626)',
          color:'#fff', fontSize:11, fontWeight:800, padding:'4px 10px',
          borderRadius:'var(--radius-full)', letterSpacing:'.03em',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}>
          -{Math.round(discount)}% OFF
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} style={{ display:'block', position:'relative', overflow:'hidden', background:'#0f0f1a' }}>
        <img
          src={product.image_url || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400`}
          alt={product.name}
          loading="lazy"
          style={{ width:'100%', height:230, objectFit:'cover', transition:'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
          onMouseLeave={e=>e.target.style.transform='scale(1)'}
          onError={e=>{ e.target.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'; }}
        />
        {/* Subtle gradient vignette at bottom of image */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(22, 22, 42, 0.7) 0%, transparent 40%)', pointerEvents:'none' }}/>

        {/* Quick action view */}
        <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:6 }}>
          <button
            onClick={e=>{ e.preventDefault(); navigate(`/products/${product.id}`); }}
            title="Quick View"
            style={{
              width:34, height:34, borderRadius:'50%',
              background:'rgba(26, 26, 48, 0.85)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255, 255, 255, 0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.5)',
              transition:'transform 150ms, background 150ms'
            }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.background='rgba(99, 102, 241, 0.8)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.background='rgba(26, 26, 48, 0.85)'; }}
          >
            <Eye size={15} color="#ffffff"/>
          </button>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding:'16px 16px 18px', display:'flex', flexDirection:'column', flex:1, gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#818cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>
            {product.brand || 'NOVA SELECT'}
          </span>
          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>
            {product.category || 'General'}
          </span>
        </div>

        <Link to={`/products/${product.id}`} style={{ textDecoration:'none' }}>
          <h3 style={{
            fontSize:15, fontWeight:600, lineHeight:1.35, color:'#f1f5f9',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
            minHeight:40, transition:'color 150ms'
          }}
          onMouseEnter={e=>e.target.style.color='#818cf8'}
          onMouseLeave={e=>e.target.style.color='#f1f5f9'}
          >
            {product.name}
          </h3>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Stars rating={product.rating || 4.5}/>
          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>
            ({product.total_reviews || 12})
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:'auto', paddingTop:4 }}>
          <span className="price-current" style={{ fontSize:20, fontWeight:800, color:'#ffffff' }}>
            ₹{finalPrice.toLocaleString('en-IN')}
          </span>
          {discount > 0 && originalPrice > finalPrice && (
            <span className="price-original" style={{ fontSize:13, color:'#64748b', textDecoration:'line-through' }}>
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm"
          style={{
            width:'100%', marginTop:8,
            padding:'10px 16px', fontWeight:700, fontSize:13,
            background:'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow:'0 4px 16px rgba(99, 102, 241, 0.3)',
            borderRadius:'var(--radius-md)',
            transition:'all 150ms'
          }}
          onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 6px 22px rgba(99, 102, 241, 0.55)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 4px 16px rgba(99, 102, 241, 0.3)'; e.currentTarget.style.transform='translateY(0)'; }}
          onClick={() => addToCart({ product_id: product.id, quantity: 1 })}
        >
          <ShoppingCart size={15}/> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

