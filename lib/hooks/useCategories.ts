import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/categories';

const QUERY_KEY = ['categories'];

export function useCategories() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5분
  });
  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
