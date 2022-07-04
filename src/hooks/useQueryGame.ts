import { useFirestoreDocument } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { UseQueryResult } from 'react-query';
import { firestore } from 'services/firebase';

/**
 * Queries single game
 * @param id - the id of the game
 * @returns
 */
export function useQueryGame(id: GameId): UseQueryResult {
  const ref = doc(firestore, 'games', id);

  return useFirestoreDocument(['games', id], ref);
}
