import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveLibrary } from 'services/firebase';
import { projectShelves } from 'utils/library';
import type { GameBox } from '../types/library';
import { queryKeys } from './queryKeys';
import { useLibrary } from './useLibrary';

export function useMutateShelvedGames(reset = false) {
  const client = useQueryClient();
  const { data: library } = useLibrary();
  return useMutation({
    mutationFn: async (data: Record<string, ShelfEntry>) => {
      if (!library?.revision) throw new Error('Migrate the library in Settings before editing shelves.');
      const entries = reset ? data : { ...projectShelves(library), ...data };
      const boxes: Record<string, GameBox> = {};
      const games = { ...library.games };
      for (const [id, entry] of Object.entries(entries)) {
        for (const contained of entry.contains) {
          if (!games[contained.id]) throw new Error(`Unknown game ${contained.id}.`);
          games[contained.id] = { ...games[contained.id], type: contained.type };
        }
        if (entry.box !== 'none') {
          const box = {
            id,
            contains: entry.contains.map((game) => game.id),
            shelfId: entry.shelfId,
            size: entry.box,
            updatedAt: entry.updatedAt,
            ...(entry.dimensions ? { dimensions: entry.dimensions } : {}),
            ...(entry.relatedEntries ? { relatedEntries: entry.relatedEntries } : {}),
          };
          const existing = library.boxes[id];
          boxes[id] = existing?.mainGameId === null ? { ...box, mainGameId: null, name: existing.name } : box;
        }
      }
      return saveLibrary(library, { games, boxes });
    },
    onSuccess: (saved) => {
      client.setQueryData(queryKeys.library, saved);
    },
  });
}
