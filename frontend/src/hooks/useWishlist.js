import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useWishlist() {
  const queryClient = useQueryClient()
  const isLoggedIn = !!localStorage.getItem('nova_token')

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isLoggedIn) return { items: [] }
      const res = await wishlistAPI.get()
      return res.data
    },
    staleTime: 1000 * 60 * 2,
  })

  const addMutation = useMutation({
    mutationFn: (productId) => wishlistAPI.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Added to wishlist ♥')
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        toast.error('Please login to add to wishlist')
      } else {
        toast.error('Failed to add to wishlist')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (productId) => wishlistAPI.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Removed from wishlist')
    },
    onError: () => toast.error('Failed to remove from wishlist'),
  })

  const wishlistIds = new Set(
    wishlist?.items?.map((item) => item.productId || item._id || item.product?._id) ?? []
  )

  const toggleWishlist = (productId) => {
    if (!isLoggedIn) {
      toast.error('Please login to use wishlist')
      return
    }
    if (wishlistIds.has(productId)) {
      removeMutation.mutate(productId)
    } else {
      addMutation.mutate(productId)
    }
  }

  return {
    wishlist,
    isLoading,
    wishlistIds,
    itemCount: wishlist?.items?.length ?? 0,
    isInWishlist: (productId) => wishlistIds.has(productId),
    toggleWishlist,
    addToWishlist: (productId) => addMutation.mutate(productId),
    removeFromWishlist: (productId) => removeMutation.mutate(productId),
    isToggling: addMutation.isPending || removeMutation.isPending,
  }
}
