import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveShelvedGames } from 'services/firebase';
import { queryKeys } from './queryKeys';

export function useMutateShelvedGames(reset = false) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, ShelfEntry>) => saveShelvedGames(data, reset),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.shelvedGames }),
  });
}
