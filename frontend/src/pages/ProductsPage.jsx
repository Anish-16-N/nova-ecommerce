import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '../services/api';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';

const SORT_OPTIONS = [
  { value:'newest',    label:'Newest First' },
  { value:'popular',   label:'Most Popular' },
  { value:'price_asc', label:'Price: Low to High' },
  { value:'price_desc',label:'Price: High to Low' },
  { value:'rating',    label:'Highest Rated' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search   = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort     = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page     = parseInt(searchParams.get('page') || '1', 10);

  const { data: catData } = useQuery({
    queryKey:['categories'],
    queryFn: ()=>api.get('/products/categories').then(r=>r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey:['products', search, category, sort, minPrice, maxPrice, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search)   params.set('search', search);
      if (category) params.set('category', category);
      if (sort)     params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('page', page); params.set('limit', '20');
      return api.get(`/products?${params}`).then(r=>r.data);
    },
    keepPreviousData: true,
  });

  const products   = data?.data || [];
  const pagination = data?.pagination || {};

  const set = (k,v) => {
    const p = new URLSearchParams(searchParams);
    if (v) p.set(k,v); else p.delete(k);
    p.delete('page');
    setSearchParams(p);
  };

  const clearAll = () => setSearchParams({});

  const hasFilters = search || category || minPrice || maxPrice;

  return (
    <div className="container" style={{ padding:'32px 24px', display:'flex', gap:28, alignItems:'flex-start' }}>
      {/* Sidebar */}
      <aside style={{ width:230, flexShrink:0, position:'sticky', top:80 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700 }}>Filters</h3>
          {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearAll}><X size={12}/> Clear</button>}
        </div>

        {/* Categories */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Category</div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <button onClick={()=>set('category','')} style={{ textAlign:'left', padding:'7px 10px', borderRadius:'var(--radius-md)', fontSize:14, fontWeight: !category?600:400, color: !category?'var(--color-primary)':'var(--color-text)', background: !category?'rgba(99,102,241,.08)':'transparent', border:'none', cursor:'pointer' }}>All Categories</button>
            {(catData||[]).map(c=>(
              <button key={c.slug} onClick={()=>set('category',c.slug)}
                style={{ textAlign:'left', padding:'7px 10px', borderRadius:'var(--radius-md)', fontSize:14, fontWeight:category===c.slug?600:400, color:category===c.slug?'var(--color-primary)':'var(--color-text)', background:category===c.slug?'rgba(99,102,241,.08)':'transparent', border:'none', cursor:'pointer' }}>
                {c.name} <span style={{ color:'var(--color-text-subtle)', fontSize:12 }}>({c.product_count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Price Range (₹)</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="number" placeholder="Min" value={minPrice} onChange={e=>set('minPrice',e.target.value)}
              className="form-input" style={{ width:'50%', padding:'8px 10px', fontSize:13 }}/>
            <span style={{ color:'var(--color-text-subtle)' }}>—</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={e=>set('maxPrice',e.target.value)}
              className="form-input" style={{ width:'50%', padding:'8px 10px', fontSize:13 }}/>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700 }}>
              {search ? (
                <span dangerouslySetInnerHTML={{ __html: `Results for "${search}"` }} />
              ) : category ? (
                (catData||[]).find(c=>c.slug===category)?.name || 'Products'
              ) : (
                'All Products'
              )}
            </h2>
            <div style={{ fontSize:13, color:'var(--color-text-muted)', marginTop:2 }}>
              {pagination.total || 0} products
            </div>
          </div>
          <select value={sort} onChange={e=>set('sort',e.target.value)}
            className="form-input" style={{ width:'auto', padding:'9px 14px', fontSize:14, cursor:'pointer' }}>
            {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {search && <Chip label={`Search: ${search}`} onRemove={()=>set('search','')}/>}
            {category && <Chip label={(catData||[]).find(c=>c.slug===category)?.name||category} onRemove={()=>set('category','')}/>}
            {minPrice && <Chip label={`Min ₹${minPrice}`} onRemove={()=>set('minPrice','')}/>}
            {maxPrice && <Chip label={`Max ₹${maxPrice}`} onRemove={()=>set('maxPrice','')}/>}
          </div>
        )}

        {/* Grid */}
        {products.length===0 && !isLoading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--color-text-muted)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            <h3>No products found</h3>
            <p style={{ marginTop:8 }}>Try adjusting your filters or search term</p>
            <button className="btn btn-primary" style={{ marginTop:20 }} onClick={clearAll}>Clear Filters</button>
          </div>
        ) : (
          <>
            <motion.div className="products-grid" initial="initial" animate="animate">
              {isLoading
                ? Array.from({length:20}).map((_,i)=><ProductCardSkeleton key={i}/>)
                : products.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)
              }
            </motion.div>
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                {Array.from({length:pagination.totalPages}, (_,i)=>i+1).slice(Math.max(0,page-3), page+2).map(p=>(
                  <button key={p} onClick={()=>set('page',p)}
                    style={{ width:38, height:38, borderRadius:'var(--radius-md)', border:'1.5px solid', borderColor:p===page?'var(--color-primary)':'var(--color-border)', background:p===page?'var(--color-primary)':'transparent', color:p===page?'#fff':'var(--color-text)', fontWeight:600, cursor:'pointer', fontSize:14 }}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', borderRadius:'var(--radius-full)', fontSize:13, color:'var(--color-primary)', fontWeight:500 }}>
      {label}
      <button onClick={onRemove} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', display:'flex', padding:0 }}><X size={13}/></button>
    </span>
  );
}

