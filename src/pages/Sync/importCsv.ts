import Papa from 'papaparse';
import type { CatalogGame } from '../../types/library';

const numericFields = {
  yearpublished: 'year',
  avgweight: 'weight',
  average: 'rating',
  rating: 'myRating',
  rank: 'rank',
  minplayers: 'minPlayerCount',
  maxplayers: 'maxPlayerCount',
  minplaytime: 'minPlaytime',
  maxplaytime: 'maxPlaytime',
} as const;
const requiredColumns = [
  'objectid',
  'objectname',
  'own',
  'preordered',
  'itemtype',
  'bggbestplayers',
  'bggrecplayers',
  'bggrecagerange',
  'bgglanguagedependence',
  ...Object.keys(numericFields),
];
const languages: Record<string, LanguageDependence> = {
  'No necessary in-game text': 'None',
  'Some necessary text - easily memorized or small crib sheet': 'Some',
  'Moderate in-game text - needs crib sheet or paste ups': 'Moderate',
  'Extensive use of text - massive conversion needed to be playable': 'Extensive',
  'Unplayable in another language': 'Required',
};

/** Parse the actual BGG CSV, including quoted commas, multiline cells and a UTF-8 BOM. */
export function parseCollectionCsv(csv: string): Record<string, CatalogGame> {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: ',',
    transformHeader: (header) => header.trim(),
  });
  if (result.errors.length) {
    throw new Error(`Invalid CSV: ${result.errors[0].message} (row ${(result.errors[0].row ?? 0) + 2}).`);
  }
  if (result.meta.renamedHeaders && Object.keys(result.meta.renamedHeaders).length) {
    throw new Error('Invalid CSV: duplicate column headers.');
  }
  const missing = requiredColumns.filter((column) => !result.meta.fields?.includes(column));
  if (missing.length) throw new Error(`Missing BGG CSV columns: ${missing.join(', ')}.`);
  const games: Record<string, CatalogGame> = {};
  result.data.forEach((row, index) => {
    const fail = (message: string): never => {
      throw new Error(`CSV row ${index + 2}: ${message}`);
    };
    const text = (column: string) => row[column]?.trim() ?? '';
    const flag = (column: string) => {
      const value = text(column);
      if (value !== '0' && value !== '1') fail(`${column} must be 0 or 1.`);
      return value === '1';
    };
    const own = flag('own');
    const preordered = flag('preordered');
    const id = text('objectid');
    if (!/^[1-9]\d*$/.test(id) || !text('objectname')) fail('a valid BGG ID and game name are required.');
    if (!own && !preordered) return;
    const numeric = (column: string) => {
      const cell = text(column);
      if (cell && !/^-?\d+(\.\d+)?$/.test(cell)) fail(`invalid number in ${column}.`);
      const value = cell ? Number(cell) : 0;
      if (!Number.isFinite(value) || (column !== 'yearpublished' && value < 0))
        fail(`invalid number in ${column}.`);
      return value;
    };
    const counts = (column: string) => {
      if (!text(column)) return [];
      return text(column)
        .split(',')
        .map((cell) => {
          if (!/^\d+$/.test(cell.trim())) fail(`invalid player count in ${column}.`);
          return Number(cell.trim());
        });
    };
    const itemtype = text('itemtype');
    if (itemtype !== 'standalone' && itemtype !== 'expansion') fail(`unsupported itemtype "${itemtype}".`);
    const bggType = itemtype === 'expansion' ? 'expansion' : 'base';
    const game: CatalogGame = {
      id,
      name: text('objectname'),
      status: own ? 'OWN' : 'PREORDERED',
      type: bggType,
      bggType,
      year: numeric('yearpublished'),
      weight: numeric('avgweight'),
      rating: numeric('average'),
      myRating: numeric('rating'),
      rank: numeric('rank'),
      minPlayerCount: numeric('minplayers'),
      maxPlayerCount: numeric('maxplayers'),
      minPlaytime: numeric('minplaytime'),
      maxPlaytime: numeric('maxplaytime'),
      bestWith: counts('bggbestplayers'),
      recommendedPlayerCount: counts('bggrecplayers'),
      recommendedAge: text('bggrecagerange'),
      languageDependence: languages[text('bgglanguagedependence')] ?? 'Unknown',
      image: '',
      thumbnail: '',
    };
    if (games[id] && JSON.stringify(games[id]) !== JSON.stringify(game)) {
      fail(`conflicting rows for BGG ID ${id}. Export one consistent entry per game.`);
    }
    games[id] = game;
  });
  if (!Object.keys(games).length)
    throw new Error('The CSV has no owned or preordered games. No changes were made.');
  return games;
}
