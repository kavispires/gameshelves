import { useQuery } from '@tanstack/react-query';
import { getGame } from 'services/firebase';
import { queryKeys } from './queryKeys';

export function useQueryGame(id: GameId) {
  return useQuery({
    queryKey: queryKeys.game(id),
    queryFn: () => getGame(id),
  });
}
