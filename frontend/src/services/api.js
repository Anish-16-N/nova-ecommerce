import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Ensure a session ID is always present for guest carts
function getSessionId() {
  let id = localStorage.getItem('nova_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now();
    localStorage.setItem('nova_session_id', id);
  }
  return id;
}

// ─── Request Interceptor: inject JWT and Session ID ──────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nova_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Session-ID'] = getSessionId();
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 on protected user queries
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
    }
    return Promise.reject(error);
  }
);

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBestSellers: (limit = 8) => api.get('/products/best-sellers', { params: { limit } }),
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),
  getCategories: () => api.get('/products/categories'),
  getByCategory: (slug, params = {}) => api.get(`/products/category/${slug}`, { params }),
};

// ════════════════════════════════════════════════════════
//  CART
// ════════════════════════════════════════════════════════
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (product_id, quantity = 1) => api.post('/cart', { product_id, quantity }),
  update: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

// ════════════════════════════════════════════════════════
//  WISHLIST
// ════════════════════════════════════════════════════════
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (product_id) => api.post('/wishlist', { product_id }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
};

// ════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  processPayment: (orderId, paymentData) =>
    api.post(`/orders/${orderId}/payment`, paymentData),
};

// ════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════
export const reviewsAPI = {
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  add: (reviewData) => api.post('/reviews', reviewData),
};

export default api;
