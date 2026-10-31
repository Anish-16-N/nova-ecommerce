import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, Truck, ShieldCheck, ArrowLeft, Plus, Minus, MessageSquare, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import api, { reviewsAPI, wishlistAPI } from '../services/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import toast from 'react-hot-toast';

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch product detail
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data.data),
  });

  // Check wishlist status
  useEffect(() => {
    if (id) {
      wishlistAPI.check(id)
        .then(res => setIsWishlisted(res.data?.inWishlist || false))
        .catch(() => {});
    }
  }, [id]);

  // Track recently viewed products in localStorage
  useEffect(() => {
    if (product && product.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('nova_recently_viewed') || '[]');
        const filtered = stored.filter(p => p.id !== product.id);
        const updated = [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            compare_price: product.compare_price,
            discount_percentage: product.discount_percentage,
            image_url: product.image_url,
            rating: product.rating,
            brand: product.brand,
          },
          ...filtered,
        ].slice(0, 8);
        localStorage.setItem('nova_recently_viewed', JSON.stringify(updated));
      } catch (e) {}
    }
  }, [product]);

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: (newReview) => reviewsAPI.add(newReview),
    onSuccess: () => {
      toast.success('Thank you! Your review has been submitted.');
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setReviewTitle('');
      setReviewBody('');
      setShowReviewForm(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    },
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewBody.trim()) {
      toast.error('Please write a review comment.');
      return;
    }
    reviewMutation.mutate({
      product_id: product.id,
      rating: reviewRating,
      title: reviewTitle.trim() || undefined,
      body: reviewBody.trim(),
      name: reviewerName.trim() || undefined,
    });
  };

  const toggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await wishlistAPI.remove(product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch (e) {
      toast.error('Could not update wishlist');
    }
  };

  // Get recently viewed products
  const recentlyViewed = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('nova_recently_viewed') || '[]');
      return stored.filter(p => String(p.id) !== String(id));
    } catch {
      return [];
    }
  })();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
          <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-xl)' }} />
          <div>
            <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 32, width: '85%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 24, width: '40%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 80, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 48, width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Product Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const discount = parseFloat(product.discount_percentage || 0);
  const finalPrice = discount > 0
    ? Math.round(parseFloat(product.price) * (1 - discount / 100))
    : parseFloat(product.price);
  const origPrice = parseFloat(product.compare_price || product.price);

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        <Link to="/" style={{ color: 'inherit' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: 'inherit' }}>Products</Link>
        {product.category_slug && (
          <>
            <span>/</span>
            <Link to={`/category/${product.category_slug}`} style={{ color: 'inherit' }}>{product.category_name}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {product.name}
        </span>
      </div>

      {/* Main Product Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 48, alignItems: 'flex-start' }}>
        {/* Left: Product Image */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <img
            src={product.slug && PRODUCT_ACCURATE_IMAGES[product.slug] ? PRODUCT_ACCURATE_IMAGES[product.slug] : (product.image_url || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800')}
            alt={product.name}
            style={{ width: '100%', height: 460, objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = product.slug && PRODUCT_ACCURATE_IMAGES[product.slug]
                ? PRODUCT_ACCURATE_IMAGES[product.slug]
                : 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800';
            }}
          />
          {discount > 0 && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
            }}>
              {Math.round(discount)}% OFF
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            {product.brand}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 12, color: 'var(--color-text)' }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i <= Math.round(product.rating || 0) ? '#fbbf24' : 'none'}
                  color={i <= Math.round(product.rating || 0) ? '#fbbf24' : '#d1d5db'}
                />
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{product.rating || 0}</span>
            <span style={{ fontSize: 14, color: 'var(--color-text-subtle)' }}>({product.total_reviews || 0} reviews)</span>
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, padding: '16px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)' }}>
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {discount > 0 && origPrice > finalPrice && (
              <span style={{ fontSize: 18, color: 'var(--color-text-subtle)', textDecoration: 'line-through' }}>
                ₹{origPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 600, marginLeft: 'auto' }}>
              Inclusive of all taxes
            </span>
          </div>

          {/* Description */}
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: 15, marginBottom: 24 }}>
            {product.description}
          </p>

          {/* Quantity Selector & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)' }}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              className="btn btn-outline btn-lg"
              style={{ flex: 1, gap: 10, fontWeight: 700 }}
              onClick={() => addToCart({ product_id: product.id, quantity })}
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>

            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1, gap: 8, fontWeight: 700 }}
              onClick={() => {
                addToCart({ product_id: product.id, quantity });
                navigate('/cart');
              }}
            >
              <Zap size={18} /> Buy Now
            </button>

            <button
              type="button"
              onClick={toggleWishlist}
              className={`btn btn-lg ${isWishlisted ? 'btn-danger' : 'btn-outline'}`}
              style={{ padding: '12px 16px' }}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Stock & Delivery Guarantees */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <Truck size={16} color="var(--color-primary)" />
              <span><strong>Free Delivery</strong> on orders over ₹999. Standard delivery in 2–4 business days.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              <span><strong>100% Authentic Guarantee</strong> with 7-day hassle-free return policy.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Customer Reviews</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Real feedback from verified purchasers</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <MessageSquare size={14} /> {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Review Submission Form */}
        {showReviewForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleReviewSubmit}
            className="card"
            style={{ padding: 24, marginBottom: 32, maxWidth: 640 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Share your experience</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Rating</label>
              <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    fill={star <= reviewRating ? '#fbbf24' : 'none'}
                    color={star <= reviewRating ? '#fbbf24' : '#d1d5db'}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
            </div>

            {!user && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex M."
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Review Headline</label>
              <input
                type="text"
                placeholder="e.g. Excellent build quality and fast performance!"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your Review</label>
              <textarea
                placeholder="Write your honest thoughts about the product..."
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                rows={4}
                className="input"
                style={{ width: '100%', resize: 'vertical' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? 'Submitting...' : 'Post Review'}
            </button>
          </motion.form>
        )}

        {/* Existing Reviews List */}
        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {product.reviews.map((r) => (
              <div key={r.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{r.full_name || r.username}</span>
                    {r.is_verified_purchase && (
                      <span className="badge badge-success" style={{ marginLeft: 8, fontSize: 11 }}>
                        <CheckCircle size={10} style={{ display: 'inline', marginRight: 3 }} /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={i <= r.rating ? '#fbbf24' : 'none'}
                        color={i <= r.rating ? '#fbbf24' : '#d1d5db'}
                      />
                    ))}
                  </div>
                </div>
                {r.title && <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: r.title }} />}
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: r.body || r.content || '' }} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No reviews yet. Be the first to review this product!</p>
        )}
      </div>

      {/* Recently Viewed Carousel */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recently Viewed</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20
          }}>
            {recentlyViewed.map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
