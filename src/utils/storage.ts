import { SHELVES_IDS } from './constants';

const definitions = [
  { id: 'east', name: 'Wall East Shelf', prefix: 'ew-', shelfPrefix: 'East Wall ' },
  { id: 'west', name: 'Window West Shelf', prefix: 'ww-', shelfPrefix: 'West Wall ' },
  { id: 'tv', name: 'TV shelf', prefix: 'tv-', shelfPrefix: 'TV Shelf ' },
  { id: 'garage', name: 'Garage container', prefix: 'garage-container', shelfPrefix: '' },
  { id: 'bags', name: 'Board game bags', prefix: 'board-game-bags', shelfPrefix: '' },
  { id: 'unshelved', name: 'Unshelved', prefix: 'unshelved', shelfPrefix: '' },
] as const;

export const STORAGES = definitions.map((storage) => ({
  ...storage,
  shelves: Object.values(SHELVES_IDS).filter((shelf) => shelf.id.startsWith(storage.prefix)),
}));

export type StorageId = (typeof STORAGES)[number]['id'];

export function storageForShelf(shelfId: string) {
  const storage = STORAGES.find((storage) => storage.shelves.some((shelf) => shelf.id === shelfId));
  if (!storage) throw new Error(`Unknown shelf location: ${shelfId}`);
  return storage;
}

export function shelfName(shelfId: string) {
  const storage = storageForShelf(shelfId);
  return SHELVES_IDS[shelfId].description.slice(storage.shelfPrefix.length);
}
