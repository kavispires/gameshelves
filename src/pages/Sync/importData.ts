import { isRecord } from 'utils/guards';

function text(entry: Record<string, unknown>, key: string): string {
  const value = entry[key];
  if (typeof value !== 'string') throw new Error(`Expected text in ${key}`);
  return value;
}

function number(entry: Record<string, unknown>, key: string): number {
  const value = entry[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Expected a finite number in ${key}`);
  }
  return value;
}

function id(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new Error('Expected a game ID');
}

export function parseCsvJson(json: string): BGGCollection[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('Expected a CSV collection array');
  return data.flatMap((entry: unknown) => {
    if (!isRecord(entry)) throw new Error('Expected a CSV collection entry');
    const own = number(entry, 'own');
    const preordered = number(entry, 'preordered');
    if (!own && !preordered) return [];
    return [
      {
        id: id(entry.objectid),
        name: text(entry, 'objectname'),
        originalName: text(entry, 'originalname'),
        status: own ? 'OWN' : 'PREORDERED',
        rating: number(entry, 'average'),
        weight: number(entry, 'avgweight'),
        bestWith: text(entry, 'bggbestplayers'),
        languageDependence: text(entry, 'bgglanguagedependence'),
        recommendedAge: text(entry, 'bggrecagerange'),
        recommendedPlayerCount: text(entry, 'bggrecplayers'),
        type: text(entry, 'itemtype'),
        maxPlayerCount: number(entry, 'maxplayers'),
        collectionId: number(entry, 'collid'),
        maxPlaytime: number(entry, 'maxplaytime'),
        minPlayerCount: number(entry, 'minplayers'),
        minPlaytime: number(entry, 'minplaytime'),
        rank: number(entry, 'rank'),
        myRating: number(entry, 'rating'),
        year: number(entry, 'yearpublished'),
      },
    ];
  });
}

export function parseXmlJson(json: string): XMLData[] {
  const data: unknown = JSON.parse(json);
  if (!isRecord(data) || !Array.isArray(data.item)) {
    throw new Error('Expected an XML collection object with an item array');
  }
  return data.item.map((entry: unknown) => {
    if (!isRecord(entry)) throw new Error('Expected an XML collection entry');
    return {
      id: id(entry['@objectid']),
      image: entry.image === undefined ? '???' : text(entry, 'image'),
      thumbnail: entry.thumbnail === undefined ? '???' : text(entry, 'thumbnail'),
      type: text(entry, '@subtype'),
    };
  });
}
