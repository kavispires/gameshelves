import { useFirestoreDocumentMutation } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { queryClient } from 'pages/App';
import { firestore } from 'services/firebase';

/**
 * Saves/updates shelved games object
 */
export function useMutateShelvedGames(reset: boolean = false) {
  const ref = doc(firestore, 'general', 'shelved-games');

  return useFirestoreDocumentMutation<Record<string, ShelfEntry>>(
    ref,
    {
      merge: !reset,
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['general', 'shelved-games']);
      },
    }
  );
}
