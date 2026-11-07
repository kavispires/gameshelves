import { useMemo } from 'react';
import { projectShelves } from 'utils/library';
import { useLibrary } from './useLibrary';

export function useQueryShelvedGames() {
  const query = useLibrary();
  const response = useMemo(() => (query.data ? projectShelves(query.data) : {}), [query.data]);
  const derived = useMemo(() => {
    const perShelf: Record<string, ShelfEntry[]> = {};
    const boxedGames: Record<string, ShelfEntry> = {};
    const orphanedGames: Record<string, ShelfEntry> = {};
    const unclassifiedGames: Record<string, ShelfEntry> = {};
    const options = new Map<string, SearchOption>();
    for (const entry of Object.values(response)) {
      perShelf[entry.shelfId] ??= [];
      perShelf[entry.shelfId].push(entry);
      if (entry.box === 'none') orphanedGames[entry.id] = entry;
      else boxedGames[entry.id] = entry;
      if (entry.box === 'unknown') unclassifiedGames[entry.id] = entry;
      for (const game of entry.contains) {
        options.set(game.id, { value: game.id, label: `${game.name} [${game.type}]` });
      }
    }
    for (const game of Object.values(query.data?.games ?? {})) {
      options.set(game.id, { value: game.id, label: `${game.name} [${game.type}]` });
    }
    const searchOptions = [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
    return { perShelf, boxedGames, orphanedGames, unclassifiedGames, searchOptions };
  }, [response, query.data]);
  return {
    ...query,
    ...derived,
    response,
    getShelvedGame: (id: string) => response[id],
    isOrphan: (id: string) => Boolean(derived.orphanedGames[id]),
    isBoxed: (id: string) => Boolean(derived.boxedGames[id]),
    isShelved: (id: string) => Boolean(response[id] && response[id].shelfId !== 'unshelved'),
  };
}
