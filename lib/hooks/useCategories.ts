import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../api/categories';

const QUERY_KEY = ['categories'];

export function useCategories() {
  const locale = useTranslation().i18n.language;
  const query = useQuery({
    queryKey: [...QUERY_KEY, locale],
    queryFn: () => getCategories(locale),
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
