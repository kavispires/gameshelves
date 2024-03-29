import { csvKeyPairs } from './constants';

type TransformedCSV = Record<GameId, BGGCollection>;

export function transformCSV(list: Record<GameId, unknown>[]): TransformedCSV {
  return list.reduce((acc: TransformedCSV, entry) => {
    if (entry.own || entry.preordered) {
      const newEntry = extractValuesFromCSV(entry);
      acc[newEntry.id] = newEntry;
    }
    return acc;
  }, {});
}

function extractValuesFromCSV(entry: Record<GameId, unknown>): BGGCollection {
  const result: any = {};
  Object.keys(csvKeyPairs).forEach((key) => {
    const newKey = csvKeyPairs[key];
    const value = entry[key];
    result[newKey] = value;
  });

  result.status = entry.own ? 'OWN' : 'PREORDERED';

  return result;
}

type TransformedXML = Record<GameId, XMLData>;

export function transformXML(list: Record<GameId, unknown>[]): TransformedXML {
  return list.reduce((acc: TransformedXML, entry) => {
    const id = entry['@objectid'] as string;
    acc[id] = {
      id,
      image: entry.image as string,
      thumbnail: entry.thumbnail as string,
      type: entry['@subtype'] as string,
    };
    return acc;
  }, {});
}

export function mergeCollections(csv: TransformedCSV, xml: TransformedXML): MergedCollectionEntry[] {
  return Object.values(csv).map((entry) => {
    return {
      ...xml[entry.id],
      ...entry,
    };
  });
}

export function checkKeyValues(list: PlainObject[]) {
  const tracker: PlainObject = {
    bestWith: {},
    languageDependence: {},
    recommendedAge: {},
    recommendedPlayerCount: {},
    type: {},
    status: {},
  };
  const canBeZero: BooleanDictionary = {};
  const canBeEmpty: BooleanDictionary = {};

  list.forEach((entry) => {
    Object.keys(entry).forEach((key: string) => {
      const value = entry[key];
      if (key in tracker) {
        if (tracker[key][value] === undefined) {
          tracker[key][value] = 0;
        }
        tracker[key][value] += 1;
      } else if (value === 0) {
        canBeZero[key] = true;
      }

      if (value === '') {
        canBeEmpty[key] = true;
      }
    });
  });

  console.log({ tracker });
  console.log({ canBeZero: Object.keys(canBeZero) });
  console.log({ canBeEmpty: Object.keys(canBeEmpty) });
}

export function prepareRawGameShelfEntry(list: MergedCollectionEntry[]): GameEntry[] {
  const result: unknown[] = [];

  list.forEach((entry) => {
    const newEntry: PlainObject = {
      id: entry.id,
      name: entry.name,
      originalName: entry.originalName,
      status: getStatus(entry.status),
      year: entry.year,
      weight: entry.weight,
      minPlayerCount: entry.minPlayerCount,
      maxPlayerCount: entry.maxPlayerCount,
      bestWith: getCountNumbers(entry.bestWith),
      recommendedPlayerCount: getCountNumbers(entry.recommendedPlayerCount),
      minPlaytime: entry.minPlaytime,
      maxPlaytime: entry.maxPlaytime,
      image: entry.image ?? '???',
      thumbnail: entry.thumbnail ?? '???',
      languageDependence: getLanguageDependency(entry.languageDependence),
      type: 'unknown',
      shelfId: 'unshelved',
    };
    // Optional Data
    if (entry.rank) {
      newEntry.rank = entry.rank;
    }
    if (entry.rating) {
      newEntry.rating = entry.rating;
    }
    if (entry.myRating) {
      newEntry.myRating = entry.myRating;
    }
    if (entry.recommendedAge) {
      newEntry.recommendedAge = entry.recommendedAge;
    }

    result.push(newEntry);
  });

  const response = result as GameEntry[];

  return response;
}

function getStatus(status: string): GameStatus {
  return status === 'PREORDERED' ? 'PREORDERED' : 'OWN';
}

function getCountNumbers(count: string): number[] {
  return count.split(',').map((v) => Number(v));
}

function getLanguageDependency(languageDependence: string): LanguageDependence {
  switch (languageDependence) {
    case 'No necessary in-game text':
      return 'None';
    case 'Some necessary text - easily memorized or small crib sheet':
      return 'Some';
    case 'Moderate in-game text - needs crib sheet or paste ups':
      return 'Moderate';
    case 'Extensive use of text - massive conversion needed to be playable':
      return 'Extensive';
    case 'Unplayable in another language':
      return 'Required';
    default:
      return 'Unknown';
  }
}

export function prepareGamesToBeSaved(games: GameEntry[], classifications: Record<GameId, Classification>) {
  const newGames = games.reduce((acc: GameEntry[], game) => {
    const classification = classifications?.[game.id];
    if (classification?.type) {
      acc.push({
        ...game,
        type: classifications[game.id].type,
      });
    }

    return acc;
  }, []);

  const shelvedGames = games.reduce((acc: Record<GameId, ShelfEntry>, game) => {
    const classification = classifications?.[game.id];

    if (!classification) {
      return acc;
    }

    const entry: ShelfEntry = {
      id: game.id,
      name: game.name,
      shelfId: classification.shelfId,
      box: classification.box,
      dimensions:
        classification.width > 0
          ? {
              width: classification.width,
              height: classification.height,
              depth: classification.depth,
            }
          : undefined,
      updatedAt: Date.now(),
      contains: [
        {
          id: game.id,
          name: game.name,
          type: classification.type,
        },
      ],
      complete: false,
    };

    // remove undefined fields
    if (!entry.dimensions) {
      delete entry.dimensions;
    }

    acc[game.id] = entry;

    return acc;
  }, {});

  return {
    games: newGames,
    shelvedGames,
  };
}

export function getShelvedGamesIdDictionary(shelvedGames: Record<GameId, ShelfEntry>): StringDictionary {
  return Object.values(shelvedGames).reduce((acc: StringDictionary, entry) => {
    entry.contains.forEach((containedEntry) => {
      acc[containedEntry?.id || String(containedEntry)] = entry.shelfId;
    });

    return acc;
  }, {});
}
