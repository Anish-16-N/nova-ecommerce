import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { ProductCardSkeleton } from '../components/product/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r=>r.data.data),
  });

  if (isLoading) return <div className="container" style={{ padding:'40px 24px' }}><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}><div className="skeleton" style={{ height:400 }}/><div><div className="skeleton" style={{ height:28, marginBottom:14 }}/><div className="skeleton" style={{ height:16, width:'60%', marginBottom:24 }}/><div className="skeleton" style={{ height:48 }}/></div></div></div>;
  if (!data) return <div className="container" style={{ padding:80, textAlign:'center' }}><h2>Product not found</h2></div>;

  const disc = parseFloat(data.discount_percentage||0);
  const finalPrice = Math.round(parseFloat(data.price)*(1-disc/100));
  const origPrice  = parseFloat(data.compare_price||data.price);

  return (
    <div className="container" style={{ padding:'40px 24px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'flex-start' }}>
        <div style={{ borderRadius:'var(--radius-xl)', overflow:'hidden', background:'var(--color-bg-secondary)', aspectRatio:'1' }}>
          <img src={data.image_url} alt={data.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
        <div>
          <div style={{ fontSize:12, color:'var(--color-text-subtle)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>{data.brand}</div>
          <h1 style={{ fontSize:26, fontWeight:800, lineHeight:1.2, marginBottom:12 }}>{data.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <div className="stars">{[1,2,3,4,5].map(i=><Star key={i} size={16} fill={i<=Math.round(data.rating)?'#fbbf24':'none'} color={i<=Math.round(data.rating)?'#fbbf24':'#d1d5db'}/>)}</div>
            <span style={{ fontSize:14, color:'var(--color-text-muted)' }}>{data.rating} ({data.total_reviews} reviews)</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:24 }}>
            <span style={{ fontSize:32, fontWeight:800 }}>₹{finalPrice.toLocaleString('en-IN')}</span>
            {disc>0&&<><span style={{ fontSize:18, color:'var(--color-text-subtle)', textDecoration:'line-through' }}>₹{origPrice.toLocaleString('en-IN')}</span><span className="badge badge-success">-{Math.round(disc)}% OFF</span></>}
          </div>
          <p style={{ color:'var(--color-text-muted)', lineHeight:1.7, marginBottom:28 }}>{data.description}</p>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-primary btn-lg" style={{ flex:1 }} onClick={()=>addToCart({product_id:data.id,quantity:1})}>
              <ShoppingCart size={18}/> Add to Cart
            </button>
          </div>
          {data.stock_quantity < 10 && <div style={{ marginTop:12, fontSize:13, color:'var(--color-error)', fontWeight:600 }}>Only {data.stock_quantity} left in stock!</div>}
        </div>
      </div>

      {/* Reviews */}
      {data.reviews?.length > 0 && (
        <div style={{ marginTop:56 }}>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Customer Reviews</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {data.reviews.map(r=>(
              <div key={r.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <span style={{ fontWeight:600, fontSize:15 }}>{r.full_name||r.username}</span>
                    {r.is_verified_purchase&&<span className="badge badge-success" style={{ marginLeft:8 }}>Verified</span>}
                  </div>
                  <div className="stars">{[1,2,3,4,5].map(i=><Star key={i} size={13} fill={i<=r.rating?'#fbbf24':'none'} color={i<=r.rating?'#fbbf24':'#d1d5db'}/>)}</div>
                </div>
                {r.title&&<div style={{ fontWeight:600, marginBottom:4 }}>{r.title}</div>}
                <p style={{ color:'var(--color-text-muted)', fontSize:14, lineHeight:1.6 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

