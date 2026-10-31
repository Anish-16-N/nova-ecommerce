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
      style={{ overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}
      whileHover={{ y:-4 }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div style={{ position:'absolute', top:12, left:12, zIndex:2,
          background:'linear-gradient(135deg,#ef4444,#dc2626)',
          color:'#fff', fontSize:11, fontWeight:800, padding:'3px 8px',
          borderRadius:'var(--radius-full)', letterSpacing:'.02em' }}>
          -{Math.round(discount)}% OFF
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} style={{ display:'block', position:'relative', overflow:'hidden', background:'var(--color-bg-secondary)' }}>
        <img
          src={product.image_url || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400`}
          alt={product.name}
          loading="lazy"
          style={{ width:'100%', height:220, objectFit:'cover', transition:'transform 350ms ease' }}
          onMouseEnter={e=>e.target.style.transform='scale(1.06)'}
          onMouseLeave={e=>e.target.style.transform='scale(1)'}
          onError={e=>{ e.target.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'; }}
        />
        {/* Quick actions overlay */}
        <motion.div
          initial={{ opacity:0 }}
          whileHover={{ opacity:1 }}
          style={{ position:'absolute', top:8, right:8, display:'flex', flexDirection:'column', gap:6 }}>
          <button onClick={e=>{e.preventDefault();navigate(`/products/${product.id}`);}}
            style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.92)', backdropFilter:'blur(4px)', border:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'var(--shadow-sm)' }}>
            <Eye size={14} color="var(--color-text-muted)"/>
          </button>
        </motion.div>
      </Link>

      {/* Info */}
      <div style={{ padding:14, display:'flex', flexDirection:'column', flex:1, gap:6 }}>
        <div style={{ fontSize:11, color:'var(--color-text-subtle)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>
          {product.brand}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 style={{ fontSize:14, fontWeight:600, lineHeight:1.35, color:'var(--color-text)',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
            transition:'color 150ms' }}
            onMouseEnter={e=>e.target.style.color='var(--color-primary)'}
            onMouseLeave={e=>e.target.style.color='var(--color-text)'}
          >{product.name}</h3>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Stars rating={product.rating || 0}/>
          <span style={{ fontSize:12, color:'var(--color-text-subtle)' }}>({product.total_reviews || 0})</span>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:2 }}>
          <span className="price-current">₹{finalPrice.toLocaleString('en-IN')}</span>
          {discount > 0 && originalPrice > finalPrice && (
            <span className="price-original">₹{originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm"
          style={{ width:'100%', marginTop:8 }}
          onClick={() => addToCart({ product_id: product.id, quantity: 1 })}
        >
          <ShoppingCart size={14}/> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

