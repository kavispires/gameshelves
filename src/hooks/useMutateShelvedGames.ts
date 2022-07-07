import { useFirestoreDocumentMutation } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { queryClient } from 'pages/App';
import { firestore } from 'services/firebase';

/**
 * Saves/updates shelved games object
 */
export function useMutateShelvedGames() {
  const ref = doc(firestore, 'general', 'shelved-games');

  return useFirestoreDocumentMutation<Record<string, ShelfEntry>>(
    ref,
    {
      merge: true,
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['general', 'shelved-games']);
      },
    }
  );
}
