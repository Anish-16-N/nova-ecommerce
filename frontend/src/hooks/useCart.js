import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useCart() {
  const queryClient = useQueryClient()

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = localStorage.getItem('nova_token')
      if (!token) return { items: [], subtotal: 0, total: 0, itemCount: 0 }
      const res = await cartAPI.get()
      return res.data
    },
    staleTime: 0,
  })

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity, variant }) =>
      cartAPI.add(productId, quantity, variant),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Added to cart!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartAPI.update(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
    onError: () => toast.error('Failed to update cart'),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId) => cartAPI.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Removed from cart')
    },
    onError: () => toast.error('Failed to remove item'),
  })

  const clearMutation = useMutation({
    mutationFn: () => cartAPI.clear(),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  })

  return {
    cart,
    isLoading,
    itemCount: cart?.itemCount ?? cart?.items?.length ?? 0,
    addToCart: (productId, quantity = 1, variant = null) =>
      addMutation.mutate({ productId, quantity, variant }),
    updateQuantity: (itemId, quantity) =>
      updateMutation.mutate({ itemId, quantity }),
    removeItem: (itemId) => removeMutation.mutate(itemId),
    clearCart: () => clearMutation.mutate(),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
