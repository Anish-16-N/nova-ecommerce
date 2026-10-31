import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useCart() {
  const queryClient = useQueryClient();

  // Fetch cart — works for BOTH logged-in users and guests via X-Session-ID
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const res = await cartAPI.get();
        // Backend returns { success: true, data: { items, subtotal, savings, delivery_fee, total, count } }
        return res.data?.data || res.data || { items: [], subtotal: 0, savings: 0, delivery_fee: 0, total: 0, count: 0 };
      } catch (err) {
        return { items: [], subtotal: 0, savings: 0, delivery_fee: 0, total: 0, count: 0 };
      }
    },
    staleTime: 0,
  });

  const cart = cartData || { items: [], subtotal: 0, savings: 0, delivery_fee: 0, total: 0, count: 0 };

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      let productId;
      let quantity = 1;

      if (typeof payload === 'object' && payload !== null) {
        productId = payload.product_id || payload.productId || payload.id;
        quantity = payload.quantity || 1;
      } else {
        productId = payload;
      }

      if (!productId) throw new Error('Missing product ID');
      return cartAPI.add(productId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 500 }}>Added to cart!</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/cart';
            }}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            View Cart & Checkout →
          </button>
        </div>
      ), { duration: 4000, icon: '🛒' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to add to cart');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ product_id, productId, quantity }) => {
      const pid = product_id || productId;
      return cartAPI.update(pid, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId) => {
      const pid = typeof productId === 'object' ? (productId.product_id || productId.productId) : productId;
      return cartAPI.remove(pid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to remove item');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => cartAPI.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart,
    isLoading,
    itemCount: cart.count ?? cart.items?.length ?? 0,
    addToCart: (param, qty) => {
      if (typeof param === 'object') {
        addMutation.mutate(param);
      } else {
        addMutation.mutate({ productId: param, quantity: qty || 1 });
      }
    },
    updateQuantity: (param, qty) => {
      if (typeof param === 'object') {
        updateMutation.mutate(param);
      } else {
        updateMutation.mutate({ productId: param, quantity: qty });
      }
    },
    removeFromCart: (productId) => removeMutation.mutate(productId),
    removeItem: (productId) => removeMutation.mutate(productId),
    clearCart: () => clearMutation.mutate(),
    isAdding: addMutation.isPending,
  };
}
