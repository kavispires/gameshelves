import { useFirestoreWriteBatch } from '@react-query-firebase/firestore';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { firestore } from 'services/firebase';

/**
 * Saves/updates multiple games
 */
export function useBatchMutateGames() {
  const batch = writeBatch(firestore);

  return {
    batch,
    mutation: useFirestoreWriteBatch(batch),
  };
}

/**
 * Get reference of game in the games collection in firebase
 */
export function getGameRef(id: GameId) {
  return doc(collection(firestore, 'games'), id);
}
