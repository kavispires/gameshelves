import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveGame } from 'services/firebase';
import { queryKeys } from './queryKeys';

export function useMutateGame(id: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: GameEntry) => saveGame(id, data),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.game(id) }),
  });
}
