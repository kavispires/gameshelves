import { useFirestoreDocumentMutation } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { queryClient } from 'pages/App';
import { firestore } from 'services/firebase';

/**
 * Saves/updates shelved games object
 */
export function useMutateImages() {
  const ref = doc(firestore, 'general', 'images');

  return useFirestoreDocumentMutation<Record<string, GameImages>>(
    ref,
    {
      merge: true,
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['general', 'images']);
      },
    }
  );
}
