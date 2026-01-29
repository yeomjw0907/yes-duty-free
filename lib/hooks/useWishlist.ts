import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listWishlist,
  isInWishlist,
  addWishlist,
  removeWishlist,
  toggleWishlist as apiToggleWishlist,
} from '../api/wishlists';
import type { Product } from '../../types';

const WISHLIST_QUERY_KEY = 'wishlist';

export function useWishlist(userId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = !!userId;

  const query = useQuery({
    queryKey: [WISHLIST_QUERY_KEY, userId],
    queryFn: () => listWishlist(userId!),
    enabled,
    staleTime: 1000 * 60,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] });

  const addMutation = useMutation({
    mutationFn: (productId: string) => addWishlist(userId!, productId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeWishlist(userId!, productId),
    onSuccess: invalidate,
  });

  return {
    wishlist: (query.data ?? []) as Product[],
    isLoading: query.isLoading,
    refetch: query.refetch,
    add: (productId: string) => addMutation.mutateAsync(productId),
    remove: (productId: string) => removeMutation.mutateAsync(productId),
    invalidate,
  };
}

export function useWishlistCheck(userId: string | undefined, productId: string | undefined) {
  const enabled = !!userId && !!productId;
  const query = useQuery({
    queryKey: [WISHLIST_QUERY_KEY, 'check', userId, productId],
    queryFn: () => isInWishlist(userId!, productId!),
    enabled,
    staleTime: 1000 * 60,
  });
  return { isInWishlist: !!query.data, isLoading: query.isLoading };
}

export function useToggleWishlist(userId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (productId: string) => apiToggleWishlist(userId!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] });
    },
  });
  return {
    toggle: (productId: string) => mutation.mutateAsync(productId),
    isToggling: mutation.isPending,
  };
}
