import { cloneDeep, isEqual } from 'lodash';
import { useMemo, useState } from 'react';
import { UseMutationResult } from 'react-query';
import { useMutateShelvedGames } from './useMutateShelvedGames';
import { useQueryShelvedGames } from './useQueryShelvedGames';

export function useMutateShelfEntry(shelfEntry: ShelfEntry) {
  const [mutatedGame, setMutation] = useState(cloneDeep(shelfEntry));
  const mutateShelvedGames = useMutateShelvedGames(true);
  const [entriesToBeOrphaned, setEntriesToBeOrphan] = useState<Record<string, ContainedGameEntry>>({});
  const { response } = useQueryShelvedGames();

  const isMutated = useMemo(() => !isEqual(shelfEntry, mutatedGame), [shelfEntry, mutatedGame]);

  function updateEntry(key: keyof ShelfEntry, value: unknown) {
    if (key === 'contains') {
      const newList = value as ContainedGameEntry[];
      const list = [...mutatedGame.contains.slice(1), ...newList];
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
    // If entry existed in the original shelf entry, set it to be orphan
    if (shelfEntry.contains.some((entry) => entry.id === item.id)) {
      setEntriesToBeOrphan((s) => ({ ...s, [item.id]: item }));
    }
    setMutation((s) => ({ ...s, contains: mutatedGame.contains.filter((entry) => entry.id !== item.id) }));
  }

  function save() {
    const shouldSaveOrphans = Object.keys(entriesToBeOrphaned).length > 0;
    const shouldSave = isMutated || shouldSaveOrphans;

    if (shouldSave) {
      const newShelvedGames = cloneDeep(response);
      if (isMutated) {
        // Perform update with mutated game
        newShelvedGames[mutatedGame.id] = mutatedGame;

        // Remove used orphans, if any
        if (mutatedGame.contains.length > 1) {
          mutatedGame.contains.forEach((entry, index) => {
            if (index > 0) {
              delete newShelvedGames[entry.id];
            }
          });
        }
      }

      if (shouldSaveOrphans) {
        Object.values(entriesToBeOrphaned).forEach((entry) => {
          newShelvedGames[entry.id] = {
            id: entry.id,
            name: entry.name,
            shelfId: 'unshelved',
            box: 'none',
            updatedAt: Date.now(),
            complete: false,
            contains: [entry],
          };
        });
      }

      mutateShelvedGames.mutate(newShelvedGames);
    }
  }

  return {
    mutatedGame,
    updateEntry,
    save,
    isMutated,
    updateEntriesToBeOrphan,
    saveResult: mutateShelvedGames as UseMutationResult,
  };
}
