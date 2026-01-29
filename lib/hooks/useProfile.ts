import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/users';

const PROFILE_QUERY_KEY = 'profile';

export function useProfile(userId: string | undefined) {
  const enabled = !!userId;
  const query = useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => getProfile(userId!),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
