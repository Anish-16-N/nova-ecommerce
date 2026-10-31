import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';

const headers = () => ({ 'X-Session-ID': localStorage.getItem('nova_session_id')||'' });

export default function WishlistPage() {
  const { addToCart } = useCart();
  const { data, isLoading } = useQuery({
    queryKey:['wishlist'],
    queryFn: ()=>api.get('/wishlist', { headers:headers() }).then(r=>r.data.data),
  });

  const items = data||[];
  return (
    <div className="container" style={{ padding:'40px 24px' }}>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:28 }}>My Wishlist</h1>
      {items.length===0&&!isLoading ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <Heart size={64} color="var(--color-border-strong)" style={{ margin:'0 auto 20px' }}/>
          <h3>Your wishlist is empty</h3>
          <Link to="/products" className="btn btn-primary" style={{ marginTop:20 }}>Browse Products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {items.map(item=>(
            <div key={item.product_id} className="card" style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
              <Link to={`/products/${item.product_id}`}><img src={item.image_url} alt={item.name} style={{ width:'100%', height:160, objectFit:'cover', borderRadius:'var(--radius-md)' }}/></Link>
              <div>
                <div style={{ fontSize:12, color:'var(--color-text-subtle)', fontWeight:600 }}>{item.brand}</div>
                <div style={{ fontSize:14, fontWeight:600, marginTop:2 }}>{item.name}</div>
                <div style={{ fontWeight:700, marginTop:6 }}>₹{parseFloat(item.price).toLocaleString('en-IN')}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>addToCart({product_id:item.product_id,quantity:1})}><ShoppingCart size={14}/> Add to Cart</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

