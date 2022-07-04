import { useFirestoreDocumentMutation } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { firestore } from 'services/firebase';

/**
 * Saves/updates single game
 * @param id - the id of the game
 * @returns
 */
export function useMutateGame(id: GameId) {
  const ref = doc(firestore, 'games', id);

  return useFirestoreDocumentMutation(ref);
}
