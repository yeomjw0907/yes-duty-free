import { useQuery } from '@tanstack/react-query';
import { getMyOrders, getOrderById, type OrderRecord, type OrderWithItems } from '../api/orders';

const ORDERS_QUERY_KEY = 'orders';

export function useOrders(userId: string | undefined) {
  const enabled = !!userId;
  const query = useQuery({
    queryKey: [ORDERS_QUERY_KEY, userId],
    queryFn: () => getMyOrders(userId!),
    enabled,
    staleTime: 1000 * 60,
  });
  return {
    orders: (query.data ?? []) as OrderRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useOrderDetail(orderId: string | null, userId: string | undefined) {
  const enabled = !!userId && !!orderId;
  const query = useQuery({
    queryKey: [ORDERS_QUERY_KEY, 'detail', orderId, userId],
    queryFn: () => getOrderById(orderId!, userId!),
    enabled,
    staleTime: 1000 * 60,
  });
  return {
    order: query.data as OrderWithItems | null | undefined,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
