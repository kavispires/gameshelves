import type { BGGCollection, MergedCollectionEntry, XMLData } from '../../types/bgg';

type TransformedCSV = Record<GameId, BGGCollection>;

export function transformCSV(list: BGGCollection[]): TransformedCSV {
  return list.reduce((acc: TransformedCSV, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});
}

type TransformedXML = Record<GameId, XMLData>;

export function transformXML(list: XMLData[]): TransformedXML {
  return list.reduce((acc: TransformedXML, entry) => {
    acc[entry.id] = entry;
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

export function prepareRawGameShelfEntry(list: MergedCollectionEntry[]): GameEntry[] {
  const result: GameEntry[] = [];

  list.forEach((entry) => {
    const newEntry: GameEntry = {
      id: entry.id,
      name: entry.name,
      originalName: entry.originalName,
      status: entry.status,
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

  return result;
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
