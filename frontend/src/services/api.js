import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor: inject JWT ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nova_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nova_token')
      localStorage.removeItem('nova_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
}

// ════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBestSellers: (limit = 8) => api.get('/products/best-sellers', { params: { limit } }),
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),
  getDeals: (limit = 8) => api.get('/products/deals', { params: { limit } }),
  getRecommended: (limit = 8) => api.get('/products/recommended', { params: { limit } }),
  getCategories: () => api.get('/products/categories'),
  getByCategory: (slug, params = {}) => api.get(`/products/category/${slug}`, { params }),
  search: (q, params = {}) => api.get('/products/search', { params: { q, ...params } }),
  getRelated: (id, limit = 4) => api.get(`/products/${id}/related`, { params: { limit } }),
}

// ════════════════════════════════════════════════════════
//  CART
// ════════════════════════════════════════════════════════
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1, variant = null) =>
    api.post('/cart/add', { productId, quantity, variant }),
  update: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),
}

// ════════════════════════════════════════════════════════
//  WISHLIST
// ════════════════════════════════════════════════════════
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist/add', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
  clear: () => api.delete('/wishlist/clear'),
}

// ════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  processPayment: (orderId, paymentData) =>
    api.post(`/orders/${orderId}/payment`, paymentData),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
}

// ════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════
export const reviewsAPI = {
  getForProduct: (productId, params = {}) =>
    api.get(`/products/${productId}/reviews`, { params }),
  add: (productId, reviewData) =>
    api.post(`/products/${productId}/reviews`, reviewData),
  update: (productId, reviewId, data) =>
    api.put(`/products/${productId}/reviews/${reviewId}`, data),
  remove: (productId, reviewId) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),
}

export default api
