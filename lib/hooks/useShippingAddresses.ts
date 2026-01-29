import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  type ShippingAddressInput,
} from '../api/shippingAddresses';
import type { ShippingAddress } from '../../types';

const QUERY_KEY = 'shipping_addresses';

export function useShippingAddresses(userId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = !!userId;

  const query = useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => listShippingAddresses(userId!),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

  const createMutation = useMutation({
    mutationFn: (input: ShippingAddressInput) => createShippingAddress(userId!, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ShippingAddressInput> }) =>
      updateShippingAddress(id, userId!, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShippingAddress(id, userId!),
    onSuccess: invalidate,
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultShippingAddress(id, userId!),
    onSuccess: invalidate,
  });

  return {
    addresses: (query.data ?? []) as ShippingAddress[],
    defaultAddress: (query.data ?? []).find((a) => a.is_default) ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create: (input: ShippingAddressInput) => createMutation.mutateAsync(input),
    update: (id: string, input: Partial<ShippingAddressInput>) => updateMutation.mutateAsync({ id, input }),
    remove: (id: string) => deleteMutation.mutateAsync(id),
    setDefault: (id: string) => setDefaultMutation.mutateAsync(id),
  };
}
