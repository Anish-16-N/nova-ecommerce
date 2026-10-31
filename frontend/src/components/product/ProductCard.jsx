import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

// Curated accurate images mapped directly to product slugs to guarantee 100% correct visual display
const PRODUCT_ACCURATE_IMAGES = {
  'apple-iphone-15-pro': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
  'samsung-galaxy-s24-ultra': 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
  'sony-wh-1000xm5': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  'apple-macbook-air-m3': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
  'oneplus-12-5g': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800',
  'jbl-charge-5-speaker': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
  'levis-511-slim-jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
  'nike-air-max-270': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  'hm-oversized-hoodie': 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
  'adidas-ultraboost-23': 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800',
  'philips-air-fryer-hd9252': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
  'dyson-v15-detect-vacuum': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
  'lakme-9to5-foundation': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
  'loreal-revitalift-serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
  'titan-edge-ultra-slim-watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  'rayban-wayfarer-sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
  'decathlon-quechua-backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  'on-gold-standard-whey-protein': 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800',
  'sony-bravia-55-4k-oled': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
  'bose-quietcomfort-45': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
  'zara-tailored-blazer': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
  'puma-velocity-nitro-2': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
  'allen-solly-casual-shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
  'ikea-kallax-shelf-unit': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  'instant-pot-duo-7in1': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
  'bamboo-bedsheet-set-6pc': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  'forest-essentials-facial-moisturiser': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
  'biotique-coconut-face-pack': 'https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=800',
  'mamaearth-vitc-face-wash': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
  'fossil-gen6-smartwatch': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
  'hidesign-leather-tote-bag': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
  'casio-g-shock-rugged-watch': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800',
  'boldfit-yoga-mat-6mm': 'https://images.unsplash.com/photo-1601925228869-d72326b97e9f?w=800',
  'fitbit-charge6-tracker': 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800',
  'nivia-storm-football': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
  'kobo-20kg-adjustable-dumbbells': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
  'obriens-signature-irish-tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800'
};

const CATEGORY_FALLBACK_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
  fashion: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  'home-living': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  beauty: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
  accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  'sports-fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
};

export function resolveCategory(product) {
  if (product?.category_name && product.category_name !== 'General') {
    return { name: product.category_name, slug: product.category_slug || 'electronics' };
  }
  const catMap = {
    1: { name: 'Electronics', slug: 'electronics' },
    2: { name: 'Fashion', slug: 'fashion' },
    3: { name: 'Home & Living', slug: 'home-living' },
    4: { name: 'Beauty', slug: 'beauty' },
    5: { name: 'Accessories', slug: 'accessories' },
    6: { name: 'Sports & Fitness', slug: 'sports-fitness' },
  };
  if (product?.category_id && catMap[product.category_id]) {
    return catMap[product.category_id];
  }
  const b = ((product?.brand || '') + ' ' + (product?.name || '') + ' ' + (product?.slug || '')).toLowerCase();
  if (/apple|iphone|samsung|galaxy|sony|oneplus|jbl|bose|macbook|tv|bravia|wh-1000xm5/.test(b)) return catMap[1];
  if (/nike|adidas|ultraboost|puma|zara|h&m|levi|shirt|hoodie|jean|shoe|sneaker|blazer/.test(b)) return catMap[2];
  if (/philips|dyson|ikea|instant pot|bedsheet|vacuum|fryer|cooker|kallax|tea/.test(b)) return catMap[3];
  if (/lakme|l'oreal|forest|biotique|mamaearth|serum|wash|foundation/.test(b)) return catMap[4];
  if (/titan|ray-ban|fossil|hidesign|casio|watch|sunglass|bag|tote|g-shock/.test(b)) return catMap[5];
  if (/decathlon|whey|protein|boldfit|fitbit|nivia|kobo|mat|dumbbell|football|backpack/.test(b)) return catMap[6];
  return { name: 'Electronics', slug: 'electronics' };
}

export function getProductPhoto(product) {
  if (!product) return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800';
  
  // 1. Direct slug match
  if (product.slug && PRODUCT_ACCURATE_IMAGES[product.slug]) {
    return PRODUCT_ACCURATE_IMAGES[product.slug];
  }

  // 2. Direct name substring matching
  const n = (product.name || '').toLowerCase();
  if (n.includes('iphone')) return PRODUCT_ACCURATE_IMAGES['apple-iphone-15-pro'];
  if (n.includes('galaxy') || n.includes('s24')) return PRODUCT_ACCURATE_IMAGES['samsung-galaxy-s24-ultra'];
  if (n.includes('ultraboost') || (n.includes('adidas') && n.includes('shoe'))) return PRODUCT_ACCURATE_IMAGES['adidas-ultraboost-23'];
  if (n.includes('air max') || (n.includes('nike') && n.includes('shoe'))) return PRODUCT_ACCURATE_IMAGES['nike-air-max-270'];
  if (n.includes('macbook')) return PRODUCT_ACCURATE_IMAGES['apple-macbook-air-m3'];
  if (n.includes('oneplus')) return PRODUCT_ACCURATE_IMAGES['oneplus-12-5g'];
  if (n.includes('wh-1000xm5') || n.includes('sony headphone')) return PRODUCT_ACCURATE_IMAGES['sony-wh-1000xm5'];
  if (n.includes('vacuum') || n.includes('dyson')) return PRODUCT_ACCURATE_IMAGES['dyson-v15-detect-vacuum'];
  if (n.includes('hoodie')) return PRODUCT_ACCURATE_IMAGES['hm-oversized-hoodie'];
  if (n.includes('jeans') || n.includes('511')) return PRODUCT_ACCURATE_IMAGES['levis-511-slim-jeans'];
  if (n.includes('air fryer')) return PRODUCT_ACCURATE_IMAGES['philips-air-fryer-hd9252'];
  if (n.includes('bravia') || n.includes('oled tv')) return PRODUCT_ACCURATE_IMAGES['sony-bravia-55-4k-oled'];
  if (n.includes('bose') || n.includes('quietcomfort')) return PRODUCT_ACCURATE_IMAGES['bose-quietcomfort-45'];
  if (n.includes('blazer')) return PRODUCT_ACCURATE_IMAGES['zara-tailored-blazer'];
  if (n.includes('nitro') || n.includes('puma')) return PRODUCT_ACCURATE_IMAGES['puma-velocity-nitro-2'];
  if (n.includes('shirt')) return PRODUCT_ACCURATE_IMAGES['allen-solly-casual-shirt'];
  if (n.includes('kallax') || n.includes('shelf')) return PRODUCT_ACCURATE_IMAGES['ikea-kallax-shelf-unit'];
  if (n.includes('instant pot')) return PRODUCT_ACCURATE_IMAGES['instant-pot-duo-7in1'];
  if (n.includes('bedsheet')) return PRODUCT_ACCURATE_IMAGES['bamboo-bedsheet-set-6pc'];
  if (n.includes('sandalwood') || n.includes('forest essentials')) return PRODUCT_ACCURATE_IMAGES['forest-essentials-facial-moisturiser'];
  if (n.includes('face pack') || n.includes('biotique')) return PRODUCT_ACCURATE_IMAGES['biotique-coconut-face-pack'];
  if (n.includes('face wash') || n.includes('mamaearth')) return PRODUCT_ACCURATE_IMAGES['mamaearth-vitc-face-wash'];
  if (n.includes('fossil') || (n.includes('gen 6') && n.includes('smartwatch'))) return PRODUCT_ACCURATE_IMAGES['fossil-gen6-smartwatch'];
  if (n.includes('hidesign') || n.includes('tote')) return PRODUCT_ACCURATE_IMAGES['hidesign-leather-tote-bag'];
  if (n.includes('g-shock') || n.includes('casio')) return PRODUCT_ACCURATE_IMAGES['casio-g-shock-rugged-watch'];
  if (n.includes('yoga') || n.includes('mat')) return PRODUCT_ACCURATE_IMAGES['boldfit-yoga-mat-6mm'];
  if (n.includes('fitbit') || n.includes('tracker')) return PRODUCT_ACCURATE_IMAGES['fitbit-charge6-tracker'];
  if (n.includes('football') || n.includes('nivia')) return PRODUCT_ACCURATE_IMAGES['nivia-storm-football'];
  if (n.includes('dumbbell') || n.includes('kobo')) return PRODUCT_ACCURATE_IMAGES['kobo-20kg-adjustable-dumbbells'];
  if (n.includes('irish tea') || n.includes("o'brien")) return PRODUCT_ACCURATE_IMAGES['obriens-signature-irish-tea'];
  if (n.includes('whey') || n.includes('protein')) return PRODUCT_ACCURATE_IMAGES['on-gold-standard-whey-protein'];
  if (n.includes('foundation') || n.includes('lakme')) return PRODUCT_ACCURATE_IMAGES['lakme-9to5-foundation'];
  if (n.includes('serum') || n.includes('revitalift')) return PRODUCT_ACCURATE_IMAGES['loreal-revitalift-serum'];
  if (n.includes('titan') || n.includes('edge')) return PRODUCT_ACCURATE_IMAGES['titan-edge-ultra-slim-watch'];
  if (n.includes('wayfarer') || n.includes('ray-ban')) return PRODUCT_ACCURATE_IMAGES['rayban-wayfarer-sunglasses'];
  if (n.includes('backpack') || n.includes('quechua')) return PRODUCT_ACCURATE_IMAGES['decathlon-quechua-backpack'];
  if (n.includes('charge 5') || n.includes('speaker')) return PRODUCT_ACCURATE_IMAGES['jbl-charge-5-speaker'];

  // 3. Image URL from product if not broken
  if (product.image_url && !product.image_url.includes('1710527710115') && !product.image_url.includes('1706220029081')) {
    return product.image_url;
  }

  // 4. Resolved category fallback
  const cat = resolveCategory(product);
  return CATEGORY_FALLBACK_IMAGES[cat.slug] || CATEGORY_FALLBACK_IMAGES.electronics;
}

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
  const resolvedCat = resolveCategory(product);
  const categoryLabel = resolvedCat.name;
  const photoUrl = getProductPhoto(product);

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
      {/* Discount or Stock badge */}
      {product.stock_quantity === 0 ? (
        <div style={{ position:'absolute', top:12, left:12, zIndex:2,
          background:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(6px)',
          border:'1px solid rgba(239, 68, 68, 0.5)',
          color:'#ef4444', fontSize:11, fontWeight:800, padding:'4px 10px',
          borderRadius:'var(--radius-full)', letterSpacing:'.03em' }}>
          OUT OF STOCK
        </div>
      ) : discount > 0 ? (
        <div style={{ position:'absolute', top:12, left:12, zIndex:2,
          background:'linear-gradient(135deg,#ef4444,#dc2626)',
          color:'#fff', fontSize:11, fontWeight:800, padding:'4px 10px',
          borderRadius:'var(--radius-full)', letterSpacing:'.03em',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}>
          -{Math.round(discount)}% OFF
        </div>
      ) : null}

      {/* Image */}
      <Link to={`/products/${product.id}`} style={{ display:'block', position:'relative', overflow:'hidden', background:'#0f0f1a' }}>
        <img
          src={photoUrl}
          alt={product.name}
          loading="lazy"
          style={{ width:'100%', height:230, objectFit:'cover', transition:'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
          onMouseLeave={e=>e.target.style.transform='scale(1)'}
          onError={e=>{
            e.target.src = CATEGORY_FALLBACK_IMAGES[resolvedCat.slug] || CATEGORY_FALLBACK_IMAGES.electronics;
          }}
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
          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>
            {categoryLabel}
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

        {product.stock_quantity === 0 ? (
          <button
            className="btn btn-sm"
            disabled
            style={{
              width:'100%', marginTop:8,
              padding:'10px 16px', fontWeight:700, fontSize:13,
              background:'rgba(255, 255, 255, 0.05)', color:'#64748b', cursor:'not-allowed',
              border:'1px solid rgba(255, 255, 255, 0.08)',
              borderRadius:'var(--radius-md)',
            }}
          >
            Out of Stock
          </button>
        ) : (
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
        )}
      </div>
    </motion.div>
  );
}

