import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductById, searchProducts } from '../api/products';
import type { Product } from '../../types';

const PRODUCTS_QUERY_KEY = 'products';

export function useProducts(categoryName?: string) {
  const query = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, categoryName ?? 'all'],
    queryFn: () => getProducts(categoryName),
    staleTime: 1000 * 60 * 2, // 2분
  });
  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProduct(id: string | null) {
  const query = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? getProductById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
  return {
    product: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSearchProducts(query: string) {
  const trimmed = query.trim();
  const searchQuery = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, 'search', trimmed],
    queryFn: () => searchProducts(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 1000 * 60,
  });
  return {
    products: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
  };
}
