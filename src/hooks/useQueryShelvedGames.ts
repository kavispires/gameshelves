import { useQuery } from '@tanstack/react-query';
import { orderBy } from 'lodash';
import { useCallback, useMemo } from 'react';
import { getShelvedGames } from 'services/firebase';
import { queryKeys } from './queryKeys';

/**
 * Queries shelved games object
 */
export function useQueryShelvedGames() {
  const { isSuccess, data, ...rest } = useQuery({
    queryKey: queryKeys.shelvedGames,
    queryFn: getShelvedGames,
  });

  const response = useMemo(() => data ?? {}, [data]);

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
        const box = index === 0 && entry.box !== 'none' ? ' :: BOX' : '';
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

  const getShelvedGame = useCallback((id: ShelfEntryId): ShelfEntry | undefined => response[id], [response]);

  const isOrphan = useCallback((id: ShelfEntryId) => Boolean(orphanedGames?.[id]), [orphanedGames]);

  const isBoxed = useCallback((id: ShelfEntryId) => Boolean(boxedGames?.[id]), [boxedGames]);

  const isShelved = useCallback(
    (id: ShelfEntryId) => Boolean(response?.[id]?.shelfId !== 'unshelved'),
    [response],
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
