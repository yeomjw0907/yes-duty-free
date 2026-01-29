import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrCreateCart,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  type CartItemWithProduct,
} from '../api/cart';
import type { Product } from '../../types';

const CART_QUERY_KEY = 'cart';

export function useCart(userId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = !!userId;

  const cartQuery = useQuery({
    queryKey: [CART_QUERY_KEY, 'cart', userId],
    queryFn: () => getOrCreateCart(userId!),
    enabled,
    staleTime: 1000 * 60,
  });

  const cartId = cartQuery.data?.id;

  const itemsQuery = useQuery({
    queryKey: [CART_QUERY_KEY, 'items', cartId],
    queryFn: () => getCartItems(cartId!),
    enabled: !!cartId,
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
  };

  const addItemMutation = useMutation({
    mutationFn: async ({
      product,
      quantity,
      selectedOptions,
    }: {
      product: Product;
      quantity: number;
      selectedOptions?: Record<string, string>;
    }) => {
      if (!cartId) throw new Error('장바구니를 먼저 불러와주세요.');
      return addCartItem(cartId, product.id, quantity, product.price, selectedOptions);
    },
    onSuccess: invalidate,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      updateCartItemQuantity(cartItemId, quantity),
    onSuccess: invalidate,
  });

  const removeItemMutation = useMutation({
    mutationFn: (cartItemId: string) => removeCartItem(cartItemId),
    onSuccess: invalidate,
  });

  return {
    cartId: cartId ?? null,
    items: (itemsQuery.data ?? []) as CartItemWithProduct[],
    isLoading: cartQuery.isLoading || itemsQuery.isLoading,
    isError: cartQuery.isError || itemsQuery.isError,
    refetch: () => {
      cartQuery.refetch();
      itemsQuery.refetch();
    },
    addToCart: (product: Product, quantity: number, selectedOptions?: Record<string, string>) =>
      addItemMutation.mutateAsync({ product, quantity, selectedOptions }),
    addToCartMutation: addItemMutation,
    updateQuantity: (cartItemId: string, quantity: number) =>
      updateQuantityMutation.mutateAsync({ cartItemId, quantity }),
    removeItem: (cartItemId: string) => removeItemMutation.mutateAsync(cartItemId),
    itemCount: (itemsQuery.data ?? []).reduce((sum, item) => sum + item.quantity, 0),
  };
}
