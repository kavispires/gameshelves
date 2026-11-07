import { BOX_SIZES, GAME_TYPES } from './constants';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeLegacyId(value: unknown): unknown {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
}

export function normalizeShelfEntry(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    id: normalizeLegacyId(value.id),
    contains: Array.isArray(value.contains)
      ? value.contains.map((entry: unknown) =>
          isRecord(entry) ? { ...entry, id: normalizeLegacyId(entry.id) } : entry,
        )
      : value.contains,
    ...(Array.isArray(value.relatedEntries)
      ? { relatedEntries: value.relatedEntries.map(normalizeLegacyId) }
      : {}),
  };
}

export function isContainedGame(value: unknown): value is ContainedGameEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    GAME_TYPES.some((type) => type === value.type)
  );
}

export function isShelfEntry(value: unknown): value is ShelfEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.shelfId === 'string' &&
    typeof value.box === 'string' &&
    BOX_SIZES.some((box) => box === value.box) &&
    typeof value.updatedAt === 'number' &&
    typeof value.complete === 'boolean' &&
    Array.isArray(value.contains) &&
    value.contains.every(isContainedGame) &&
    (value.dimensions === undefined ||
      (isRecord(value.dimensions) &&
        typeof value.dimensions.width === 'number' &&
        typeof value.dimensions.height === 'number' &&
        typeof value.dimensions.depth === 'number')) &&
    (value.relatedEntries === undefined ||
      (Array.isArray(value.relatedEntries) && value.relatedEntries.every((id) => typeof id === 'string')))
  );
}

export function isGameImages(value: unknown): value is GameImages {
  return (
    isRecord(value) &&
    (value.thumbnail === undefined || typeof value.thumbnail === 'string') &&
    (value.image === undefined || typeof value.image === 'string')
  );
}

export function isGameEntry(value: unknown): value is GameEntry {
  return (
    isRecord(value) &&
    isContainedGame(value) &&
    typeof value.originalName === 'string' &&
    (value.status === 'OWN' || value.status === 'PREORDERED') &&
    typeof value.shelfId === 'string' &&
    ['year', 'weight', 'minPlayerCount', 'maxPlayerCount', 'minPlaytime', 'maxPlaytime'].every(
      (key) => typeof value[key] === 'number',
    ) &&
    ['rank', 'rating', 'myRating'].every(
      (key) => value[key] === undefined || typeof value[key] === 'number',
    ) &&
    Array.isArray(value.bestWith) &&
    value.bestWith.every((count) => typeof count === 'number') &&
    Array.isArray(value.recommendedPlayerCount) &&
    value.recommendedPlayerCount.every((count) => typeof count === 'number') &&
    typeof value.image === 'string' &&
    typeof value.thumbnail === 'string' &&
    (value.recommendedAge === undefined || typeof value.recommendedAge === 'string') &&
    ['Unknown', 'Required', 'Extensive', 'Moderate', 'Some', 'None'].includes(
      String(value.languageDependence),
    )
  );
}
