import { isEqual } from 'lodash';
import type {
  CatalogGame,
  GameBox,
  ImportPreview,
  LegacyGame,
  Library,
  LibraryContent,
} from '../types/library';
import { BOX_SIZES, GAME_TYPES, SHELVES_IDS } from './constants';
import { isRecord } from './guards';

export const DOCUMENT_BUDGET = 800 * 1024;
const encoder = new TextEncoder();
const byteSize = (text: string) => encoder.encode(text).length + 1;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonnegative = (value: unknown): value is number => finite(value) && value >= 0;
const gameId = (value: string) => /^[1-9]\d*$/.test(value);

export function validDimensions(value: unknown): value is BoxDimensions {
  return isRecord(value) && [value.width, value.height, value.depth].every((v) => finite(v) && v > 0);
}

function isCatalogGame(value: unknown): value is CatalogGame {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    gameId(value.id) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    (value.status === 'OWN' || value.status === 'PREORDERED') &&
    (value.bggType === 'base' || value.bggType === 'expansion') &&
    GAME_TYPES.some((type) => type === value.type) &&
    finite(value.year) &&
    ['weight', 'minPlayerCount', 'maxPlayerCount', 'minPlaytime', 'maxPlaytime'].every((k) =>
      nonnegative(value[k]),
    ) &&
    ['rating', 'myRating', 'rank'].every((k) => value[k] === undefined || nonnegative(value[k])) &&
    Array.isArray(value.bestWith) &&
    value.bestWith.every(nonnegative) &&
    Array.isArray(value.recommendedPlayerCount) &&
    value.recommendedPlayerCount.every(nonnegative) &&
    typeof value.image === 'string' &&
    typeof value.thumbnail === 'string' &&
    (value.recommendedAge === undefined || typeof value.recommendedAge === 'string') &&
    ['Unknown', 'Required', 'Extensive', 'Moderate', 'Some', 'None'].includes(
      String(value.languageDependence),
    )
  );
}

function isBox(value: unknown): value is GameBox {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    (value.mainGameId === undefined ||
      (value.mainGameId === null && typeof value.name === 'string' && value.name.trim().length > 0)) &&
    Array.isArray(value.contains) &&
    value.contains.every((id) => typeof id === 'string') &&
    typeof value.shelfId === 'string' &&
    Object.hasOwn(SHELVES_IDS, value.shelfId) &&
    value.size !== 'none' &&
    BOX_SIZES.some((size) => size === value.size) &&
    finite(value.updatedAt) &&
    (value.dimensions === undefined || validDimensions(value.dimensions)) &&
    (value.relatedEntries === undefined ||
      (Array.isArray(value.relatedEntries) && value.relatedEntries.every((id) => typeof id === 'string')))
  );
}

/** Validate both maps together: a physical game has exactly zero or one box. */
export function validateContent(value: unknown): asserts value is LibraryContent {
  if (!isRecord(value) || !isRecord(value.games) || !isRecord(value.boxes)) {
    throw new Error('Invalid library: expected catalog and boxes maps.');
  }
  const { games, boxes } = value;
  for (const [id, game] of Object.entries(games)) {
    if (!isCatalogGame(game) || game.id !== id) {
      throw new Error(`Invalid catalog game ${id}.`);
    }
  }
  const assigned = new Set<string>();
  for (const [id, box] of Object.entries(boxes)) {
    if (!isBox(box) || box.id !== id) {
      throw new Error(`Invalid box ${id}.`);
    }
    if (
      box.mainGameId === null ? Object.hasOwn(games, id) : !Object.hasOwn(games, id) || box.contains[0] !== id
    ) {
      throw new Error(`Invalid box ${id}: its main game must be first and match its ID.`);
    }
    for (const containedId of box.contains) {
      if (!Object.hasOwn(games, containedId) || assigned.has(containedId)) {
        throw new Error(`Conflicting box assignment for game ${containedId}.`);
      }
      assigned.add(containedId);
    }
    if (box.relatedEntries?.some((related) => !Object.hasOwn(boxes, related))) {
      throw new Error(`Invalid related box in ${id}.`);
    }
  }
}

// Firestore counts UTF-8 strings, field names, 8-byte numbers, and 32 bytes per map.
// JSON length is not a document-size calculation.
function valueSize(value: unknown): number {
  if (typeof value === 'string') return byteSize(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot store non-finite numbers.');
    return 8;
  }
  if (typeof value === 'boolean' || value === null) return 1;
  if (Array.isArray(value)) return value.reduce((size, item) => size + valueSize(item), 0);
  if (isRecord(value)) {
    return Object.entries(value).reduce((size, [key, item]) => size + byteSize(key) + valueSize(item), 32);
  }
  throw new Error('Cannot store undefined or unsupported library values.');
}

export function libraryDocuments(content: LibraryContent, revision: string) {
  validateContent(content);
  const catalog = { schemaVersion: 1, revision, games: content.games };
  const boxes = { schemaVersion: 1, revision, boxes: content.boxes };
  for (const [name, data] of Object.entries({ catalog, boxes })) {
    const size = byteSize('general') + byteSize(name) + 16 + valueSize(data);
    if (size > DOCUMENT_BUDGET) {
      throw new Error(
        `general/${name} exceeds the 800 KiB safety budget (${Math.ceil(size / 1024)} KiB). Nothing was saved. The library needs chunked storage before importing this file.`,
      );
    }
  }
  return { catalog, boxes };
}

export function readLibrary(catalog: unknown, boxes: unknown): Library {
  if (
    !isRecord(catalog) ||
    !isRecord(boxes) ||
    catalog.schemaVersion !== 1 ||
    boxes.schemaVersion !== 1 ||
    typeof catalog.revision !== 'string' ||
    !catalog.revision ||
    catalog.revision !== boxes.revision
  ) {
    throw new Error('Invalid or inconsistent library documents. Refresh the library and try again.');
  }
  const content = { games: catalog.games, boxes: boxes.boxes };
  validateContent(content);
  return { ...content, revision: catalog.revision };
}

export function findBox(boxes: Record<string, GameBox>, gameId: string): GameBox | undefined {
  return Object.values(boxes).find((box) => box.contains.includes(gameId));
}

export function getBoxName(box: GameBox, games: Record<string, CatalogGame>): string {
  return box.mainGameId === null ? box.name : games[box.id].name;
}

export function projectShelves(library: Library): Record<string, ShelfEntry> {
  if (library.legacy) return library.legacy.shelves;
  return Object.fromEntries(
    Object.values(library.boxes).map((box) => [
      box.id,
      {
        id: box.id,
        name: getBoxName(box, library.games),
        shelfId: box.shelfId,
        box: box.size,
        ...(box.dimensions ? { dimensions: box.dimensions } : {}),
        contains: box.contains.map((id) => {
          const game = library.games[id];
          return { id, name: game.name, type: game.type };
        }),
        updatedAt: box.updatedAt,
        complete: Boolean(box.dimensions),
        ...(box.relatedEntries ? { relatedEntries: box.relatedEntries } : {}),
      },
    ]),
  );
}

function pruneBoxes(boxes: Record<string, GameBox>, games: Record<string, CatalogGame>) {
  const result: Record<string, GameBox> = {};
  for (const [id, box] of Object.entries(boxes)) {
    if (box.mainGameId === null || games[id]) {
      result[id] = { ...box, contains: box.contains.filter((containedId) => games[containedId]) };
    }
  }
  for (const box of Object.values(result)) {
    if (box.relatedEntries) {
      box.relatedEntries = box.relatedEntries.filter((id) => result[id]);
    }
  }
  return result;
}

export function prepareImport(
  base: Library,
  imported: Record<string, CatalogGame>,
  archived: Record<string, LegacyGame> = {},
): ImportPreview {
  if (!Object.keys(imported).length) throw new Error('The CSV has no owned or preordered games.');
  const games: Record<string, CatalogGame> = {};
  const legacyGames: Record<string, ContainedGameEntry> = {};
  const legacyBoxes: Record<string, GameBox> = {};
  if (base.legacy) {
    for (const [id, entry] of Object.entries(base.legacy.shelves)) {
      const custom = id === 'promos';
      if (entry.id !== id || (!custom && entry.contains[0]?.id !== id)) {
        throw new Error(
          `Migration blocked: box ${id} has an ambiguous main game. Resolve the legacy entry first.`,
        );
      }
      for (const game of entry.contains) {
        if (legacyGames[game.id]) {
          throw new Error(`Migration blocked: game ${game.id} is assigned more than once.`);
        }
        legacyGames[game.id] = game;
      }
      if (entry.dimensions && !validDimensions(entry.dimensions)) {
        throw new Error(`Migration blocked: box ${id} has incomplete or invalid dimensions.`);
      }
      if (entry.box === 'none' && (entry.contains.length !== 1 || entry.shelfId !== 'unshelved')) {
        throw new Error(`Migration blocked: loose entry ${id} has ambiguous contents or shelf placement.`);
      }
      if (entry.box !== 'none') {
        const box = {
          id,
          contains: entry.contains.map((game) => game.id),
          size: entry.box,
          shelfId: entry.shelfId,
          updatedAt: entry.updatedAt,
          ...(entry.dimensions ? { dimensions: entry.dimensions } : {}),
          ...(entry.relatedEntries ? { relatedEntries: entry.relatedEntries } : {}),
        };
        legacyBoxes[id] = custom ? { ...box, mainGameId: null, name: entry.name } : box;
      }
    }
  }
  for (const [id, game] of Object.entries(imported)) {
    const existing = base.games[id];
    const images = existing ?? base.legacy?.images[id];
    const usableImage = (url: string | undefined) => (url && url !== '???' ? url : '');
    games[id] = {
      ...game,
      type: existing?.type ?? legacyGames[id]?.type ?? archived[id]?.type ?? game.type,
      image: usableImage(existing?.image) || usableImage(archived[id]?.image) || usableImage(images?.image),
      thumbnail:
        usableImage(existing?.thumbnail) ||
        usableImage(archived[id]?.thumbnail) ||
        usableImage(images?.thumbnail),
    };
  }
  const originalBoxes = base.legacy ? legacyBoxes : base.boxes;
  const boxes = pruneBoxes(originalBoxes, games);
  const previousGames = base.legacy ? { ...archived, ...legacyGames } : base.games;
  const removed = Object.values(previousGames)
    .filter((game) => !games[game.id])
    .map(({ id, name }) => ({ id, name }));
  const released = Object.values(originalBoxes)
    .filter((box) => box.mainGameId !== null && !games[box.id])
    .flatMap((box) => box.contains.filter((id) => games[id]));
  const next = { games, boxes };
  libraryDocuments(next, '00000000-0000-0000-0000-000000000000');
  return {
    base,
    next,
    added: Object.keys(games).filter((id) => !previousGames[id]),
    changed: Object.keys(games).filter((id) => previousGames[id] && !isEqual(base.games[id], games[id])),
    removed,
    released,
  };
}

export function updateBox(
  library: Library,
  id: string,
  box: GameBox | null,
  types: Record<string, GameType> = {},
): LibraryContent {
  if (!library.revision) throw new Error('Import and migrate the library in Settings before editing boxes.');
  const games = { ...library.games };
  for (const [gameId, type] of Object.entries(types)) {
    if (!games[gameId]) throw new Error(`Unknown game ${gameId}.`);
    games[gameId] = { ...games[gameId], type };
  }
  const boxes = { ...library.boxes };
  if (box) {
    if (box.id !== id) throw new Error('Cannot change a box ID.');
    boxes[id] = { ...box, updatedAt: Date.now() };
  } else {
    delete boxes[id];
    for (const [boxId, entry] of Object.entries(boxes)) {
      if (entry.relatedEntries?.includes(id)) {
        boxes[boxId] = { ...entry, relatedEntries: entry.relatedEntries.filter((related) => related !== id) };
      }
    }
  }
  const next = { games, boxes };
  libraryDocuments(next, '00000000-0000-0000-0000-000000000000');
  return next;
}
