import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveGames } from 'services/firebase';

export function useBatchMutateGames() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveGames,
    onSuccess: () => client.invalidateQueries({ queryKey: ['games'] }),
  });
}
