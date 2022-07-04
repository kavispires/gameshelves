import { useFirestoreDocument } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { firestore } from 'services/firebase';

/**
 * Queries shelved games object
 */
export function useQueryShelvedGames() {
  const ref = doc(firestore, 'general', 'shelved-games');

  const { isSuccess, data, ...rest } = useFirestoreDocument<Record<string, ShelfEntry>>(
    ['general', 'shelved-games'],
    ref
  );

  const response = useMemo(() => (isSuccess ? data?.data() ?? {} : {}), [isSuccess, data]);

  const searchOptions = useMemo(() => {
    const res: SearchOption[] = [];
    Object.values(response).forEach((entry) => {
      entry.contains.forEach((containedGame) => {
        res.push({
          label: `${containedGame.name} [${containedGame.type}]`,
          value: entry.id,
        });
      });
    });

    return res;
  }, [response]);

  return {
    ...rest,
    isSuccess,
    data,
    response,
    searchOptions,
  };
}
