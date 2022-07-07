import { cloneDeep, isEqual } from 'lodash';
import { useMemo, useState } from 'react';
import { useMutateShelvedGames } from './useMutateShelvedGames';

export function useMutateShelfEntry(shelfEntry: ShelfEntry) {
  const [mutatedGame, setMutation] = useState(cloneDeep(shelfEntry));
  const { mutate } = useMutateShelvedGames();

  const isMutated = useMemo(() => !isEqual(shelfEntry, mutatedGame), [shelfEntry, mutatedGame]);

  function updateEntry(key: keyof ShelfEntry, value: unknown) {
    setMutation((s) => ({ ...s, [key]: value }));
  }

  function save() {
    if (isMutated) {
      // Prepare object for partial update
      // Perform update with mutate
      console.log({ mutatedGame, mutate });
    }
  }

  return {
    mutatedGame,
    updateEntry,
    save,
    isMutated,
  };
}
