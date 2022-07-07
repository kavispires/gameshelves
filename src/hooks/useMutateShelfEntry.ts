import { cloneDeep, isEqual } from 'lodash';
import { useMemo, useState } from 'react';
import { useMutateShelvedGames } from './useMutateShelvedGames';

export function useMutateShelfEntry(shelfEntry: ShelfEntry) {
  const [mutatedGame, setMutation] = useState(cloneDeep(shelfEntry));
  const { mutate } = useMutateShelvedGames();
  const [entriesToBeOrphaned, setEntriesToBeOrphan] = useState<Record<string, ContainedGameEntry>>({});

  const isMutated = useMemo(() => !isEqual(shelfEntry, mutatedGame), [shelfEntry, mutatedGame]);

  function updateEntry(key: keyof ShelfEntry, value: unknown) {
    if (key === 'contains') {
      const list = value as ContainedGameEntry[];
      const uniqueList = Object.values(
        list.reduce((acc: Record<string, ContainedGameEntry>, entry) => {
          acc[entry.id] = entry;
          return acc;
        }, {})
      );
      setMutation((s) => ({ ...s, [key]: [s.contains[0], ...uniqueList] }));
    } else {
      setMutation((s) => ({ ...s, [key]: value }));
    }
  }

  function updateEntriesToBeOrphan(item: ContainedGameEntry) {
    if (shelfEntry.contains.some((entry) => entry.id === item.id)) {
      setEntriesToBeOrphan((s) => ({ ...s, [item.id]: item }));
    } else {
      setMutation((s) => ({ ...s, contains: mutatedGame.contains.filter((entry) => entry.id !== item.id) }));
    }
  }

  function save() {
    if (isMutated) {
      // Prepare object for partial update
      // Perform update with mutate
      console.log({ mutatedGame });
    }

    // Remove used orphans, if any
    if (isMutated && mutatedGame.contains.length > 1) {
      console.log('handle delete orphans');
    }
    if (Object.keys(entriesToBeOrphaned).length > 0) {
      console.log({ entriesToBeOrphaned });
    }
  }

  return {
    mutatedGame,
    updateEntry,
    save,
    isMutated,
    updateEntriesToBeOrphan,
  };
}
