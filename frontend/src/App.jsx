import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AuthProvider } from './hooks/useAuth';

// Lazy-loaded pages
const HomePage         = lazy(() => import('./pages/HomePage'));
const ProductsPage     = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage= lazy(() => import('./pages/ProductDetailPage'));
const CategoryPage     = lazy(() => import('./pages/CategoryPage'));
const CartPage         = lazy(() => import('./pages/CartPage'));
const CheckoutPage     = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage       = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage  = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage     = lazy(() => import('./pages/WishlistPage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));

// Security Lab pages
const SecurityLabPage  = lazy(() => import('./pages/security-lab/SecurityLabPage'));
const SQLiLabPage      = lazy(() => import('./pages/security-lab/SQLiLabPage'));
const XSSLabPage       = lazy(() => import('./pages/security-lab/XSSLabPage'));
const DDoSLabPage      = lazy(() => import('./pages/security-lab/DDoSLabPage'));

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="spinner" />
    </div>
  );
}

function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function LabLayout({ children }) {
  return (
    <>
      <Navbar minimal />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Security Lab — separate layout */}
          <Route path="/security-lab" element={<LabLayout><SecurityLabPage /></LabLayout>} />
          <Route path="/security-lab/sqli" element={<LabLayout><SQLiLabPage /></LabLayout>} />
          <Route path="/security-lab/xss"  element={<LabLayout><XSSLabPage /></LabLayout>} />
          <Route path="/security-lab/ddos" element={<LabLayout><DDoSLabPage /></LabLayout>} />

          {/* Main shop routes */}
          <Route path="/" element={<ShopLayout><HomePage /></ShopLayout>} />
          <Route path="/products" element={<ShopLayout><ProductsPage /></ShopLayout>} />
          <Route path="/products/:id" element={<ShopLayout><ProductDetailPage /></ShopLayout>} />
          <Route path="/category/:slug" element={<ShopLayout><CategoryPage /></ShopLayout>} />
          <Route path="/cart" element={<ShopLayout><CartPage /></ShopLayout>} />
          <Route path="/checkout" element={<ShopLayout><CheckoutPage /></ShopLayout>} />
          <Route path="/orders" element={<ShopLayout><OrdersPage /></ShopLayout>} />
          <Route path="/orders/:id" element={<ShopLayout><OrderDetailPage /></ShopLayout>} />
          <Route path="/wishlist" element={<ShopLayout><WishlistPage /></ShopLayout>} />
          <Route path="/login" element={<ShopLayout><LoginPage /></ShopLayout>} />
          <Route path="/register" element={<ShopLayout><RegisterPage /></ShopLayout>} />
          <Route path="/profile" element={<ShopLayout><ProfilePage /></ShopLayout>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

