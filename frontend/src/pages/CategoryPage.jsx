import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import api from '../services/api';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState('popular');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch category details
  const { data: catList } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data.data),
  });

  const category = (catList || []).find(c => c.slug === slug) || {
    name: slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ') : 'Category',
    description: 'Explore our hand-picked collection in this category.',
    image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
  };

  // Fetch products in this category
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['category-products', slug, sort, minPrice, maxPrice],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('category', slug);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      return api.get(`/products?${params.toString()}`).then(r => r.data);
    },
  });

  const products = productsData?.data || [];

  return (
    <div>
      {/* Category Hero Banner */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#fff',
        padding: '60px 0 50px',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
          backgroundImage: `url(${category.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.25,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to All Products
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="badge badge-primary" style={{ marginBottom: 12, background: 'rgba(99,102,241,.2)', color: '#a5b4fc' }}>
              Collection
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 10, color: '#f8fafc' }}>
              {category.name}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 540, lineHeight: 1.6 }}>
              {category.description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content & Controls */}
      <div className="container" style={{ padding: '36px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Showing <strong style={{ color: 'var(--color-text)' }}>{products.length}</strong> products in {category.name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <ArrowUpDown size={14} />
              <span>Sort by:</span>
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🛍️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No products currently found in this category</h3>
            <p style={{ fontSize: 14 }}>Check back soon or explore other exciting collections.</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 20 }}>
              Browse All Products
            </Link>
          </div>
        ) : (
          <motion.div
            className="products-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </motion.div>
        )}
      </div>
    </div>
  );
}
