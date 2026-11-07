import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLibrary, saveLibrary } from 'services/firebase';
import type { Library, LibraryContent } from '../types/library';
import { queryKeys } from './queryKeys';

export function useLibrary() {
  return useQuery({
    queryKey: queryKeys.library,
    queryFn: getLibrary,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export function useSaveLibrary() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ base, next }: { base: Library; next: LibraryContent }) => saveLibrary(base, next),
    onSuccess: (library) => {
      client.setQueryData(queryKeys.library, library);
    },
  });
}
