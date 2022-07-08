import { useFirestoreDocument } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { orderBy } from 'lodash';
import { useCallback, useMemo } from 'react';
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

  const { searchOptions, perShelf, boxedGames, orphanedGames, unclassifiedGames } = useMemo(() => {
    const searchOptionsResult: SearchOption[] = [];
    const perShelfResult: Record<ShelfId, ShelfEntry[]> = {};
    const boxedGamesResult: Record<GameId, ShelfEntry> = {};
    const orphanedGamesResult: Record<GameId, ShelfEntry> = {};
    const unclassifiedGamesResult: Record<GameId, ShelfEntry> = {};

    orderBy(Object.values(response), ['name']).forEach((entry) => {
      // Handle search options
      // TODO: should show all games, temporarily showing only owned boxes and orphans
      entry.contains.forEach((containedGame, index) => {
        const box = index === 0 && entry.box !== 'none' ? ' [BOX]' : '';
        if (index === 0 && entry.box !== 'unknown') {
          searchOptionsResult.push({
            label: `${containedGame.name} [${containedGame.type}]${box}`,
            value: entry.id,
          });
        }
      });

      // Handle per shelf
      if (perShelfResult[entry.shelfId] === undefined) {
        perShelfResult[entry.shelfId] = [];
      }
      perShelfResult[entry.shelfId].push(entry);

      // Handle boxed, orphaned, and unclassified games
      switch (entry.box) {
        case 'none':
          orphanedGamesResult[entry.id] = entry;
          break;
        case 'unknown':
          unclassifiedGamesResult[entry.id] = entry;
          break;
        default:
          boxedGamesResult[entry.id] = entry;
      }
    });

    return {
      searchOptions: searchOptionsResult,
      perShelf: perShelfResult,
      boxedGames: boxedGamesResult,
      orphanedGames: orphanedGamesResult,
      unclassifiedGames: unclassifiedGamesResult,
    };
  }, [response]);

  const getShelvedGame = useCallback((id: ShelfEntryId) => response?.[id] ?? {}, [response]);

  const isOrphan = useCallback((id: ShelfEntryId) => Boolean(orphanedGames?.[id]), [orphanedGames]);

  const isBoxed = useCallback((id: ShelfEntryId) => Boolean(boxedGames?.[id]), [boxedGames]);

  const isShelved = useCallback(
    (id: ShelfEntryId) => Boolean(response?.[id]?.shelfId !== 'unshelved'),
    [response]
  );

  return {
    ...rest,
    isSuccess,
    data,
    response,
    searchOptions,
    perShelf,
    boxedGames,
    orphanedGames,
    unclassifiedGames,
    getShelvedGame,
    isOrphan,
    isBoxed,
    isShelved,
  };
}
