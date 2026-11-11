import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFriends, saveFriend } from 'services/firebase';
import type { Friend, FriendsState } from '../types/friends';
import { queryKeys } from './queryKeys';

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: getFriends,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSaveFriend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ base, friend }: { base: FriendsState; friend: Friend }) => saveFriend(base, friend),
    onSuccess: (state) => client.setQueryData(queryKeys.friends, state),
  });
}
