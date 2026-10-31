import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  ArrowLeft,
  Download,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

const SESSION_KEY = 'nova_session_id';
const headers = () => ({ 'X-Session-ID': localStorage.getItem(SESSION_KEY) || '' });

const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Received & Confirmed', icon: Package },
  { key: 'paid', label: 'Payment Verified', desc: 'Securely processed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', desc: 'Packed at warehouse', icon: Clock },
  { key: 'shipped', label: 'In Transit', desc: 'With courier partner', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'At your doorstep', icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/${id}`, { headers: headers() }).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--color-error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Order Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>The requested order details could not be retrieved.</p>
        <Link to="/orders" className="btn btn-primary">
          <ArrowLeft size={16} /> View All Orders
        </Link>
      </div>
    );
  }

  // Parse shipping address if stored as string
  let addr = order.shipping_address;
  if (typeof addr === 'string') {
    try {
      addr = JSON.parse(addr);
    } catch {
      addr = {};
    }
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const estDelivery = order.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '5-7 business days';

  return (
    <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      {/* Top Nav Back */}
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to My Orders
      </Link>

      {/* Order Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: 28, marginBottom: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              Order Details
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
              {order.order_number}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-success" style={{ fontSize: 12, padding: '6px 12px' }}>
              {order.status?.toUpperCase() || 'CONFIRMED'}
            </span>
            <button
              onClick={() => alert(`Simulated Invoice: ${order.order_number}\nTotal Amount: ₹${order.total_amount}\nStatus: ${order.status}`)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Download Receipt
            </button>
          </div>
        </div>

        {/* Tracking Progression */}
        <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Delivery Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
            {TRACKING_STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx <= 1; // Order Placed & Payment Verified active
              return (
                <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isPast ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
                      color: isPast ? '#fff' : 'var(--color-text-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: isPast ? 700 : 500, color: isPast ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {s.label}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', paddingLeft: 36 }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Grid: Items & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>

        {/* Order Items */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="var(--color-primary)" /> Items in this Order ({items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 14, borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <img
                  src={item.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                  alt={item.product_name}
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--color-bg-secondary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>{item.brand || 'NOVA'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Qty: {item.quantity} × ₹{parseFloat(item.final_price || item.unit_price).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
                  ₹{(parseFloat(item.final_price || item.unit_price) * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Address & Payment Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Delivery Address */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="var(--color-primary)" /> Shipping Address
            </h4>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)' }}>
              <div style={{ fontWeight: 600 }}>{addr.full_name || 'Customer'}</div>
              <div>{addr.address_line1 || 'Address Line 1'}</div>
              {addr.address_line2 && <div>{addr.address_line2}</div>}
              <div>{addr.city || 'City'}, {addr.state || 'State'} - {addr.pin_code || '000000'}</div>
              {addr.phone && <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Phone: {addr.phone}</div>}
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Estimated Delivery: <strong style={{ color: 'var(--color-text)' }}>{estDelivery}</strong>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="var(--color-primary)" /> Payment Summary
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                <span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(order.discount_amount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                  <span>Discounts Applied</span>
                  <span>-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Shipping Fee</span>
                <span>{parseFloat(order.delivery_fee || 0) === 0 ? 'Free' : `₹${order.delivery_fee}`}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                <span>Total Amount</span>
                <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {order.transaction_id && (
                <div style={{ marginTop: 8, padding: 8, background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: 11, color: 'var(--color-text-subtle)' }}>
                  TXN: <code style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{order.transaction_id}</code>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
