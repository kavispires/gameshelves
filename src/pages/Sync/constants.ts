export const csvKeyPairs: StringDictionary = {
  average: 'rating', // number: average rating
  avgweight: 'weight', // number: average weight
  bggbestplayers: 'bestWith', // string: best with
  bgglanguagedependence: 'languageDependence', // language dependency
  bggrecagerange: 'recommendedAge', // string: recommended age range
  bggrecplayers: 'recommendedPlayerCount', // string: recommended player count
  itemtype: 'type', // string: base (standalone or expansion)
  maxplayers: 'maxPlayerCount',
  collid: 'collectionId', // number: collection id
  maxplaytime: 'maxPlaytime',
  minplayers: 'minPlayerCount',
  minplaytime: 'minPlaytime',
  objectid: 'id', // number: id
  objectname: 'name', // string: game name
  originalname: 'originalName', // string: original name if I changed?
  playingtime: 'playtime',
  rank: 'rank',
  rating: 'myRating', // number, my rating
  yearpublished: 'year',
};

export const DEFAULT_BOX_DIMENSIONS: Record<string, BoxPresets> = {
  Unknown: {
    width: 0,
    height: 0,
    depth: 0,
    box: 'unknown',
  },
  'Ticket To Ride': {
    width: 300,
    height: 300,
    depth: 80,
    box: 'regular',
  },
  'Queen Big Box': {
    width: 400,
    height: 320,
    depth: 100,
    box: 'big-box',
  },
  Codenames: {
    width: 235,
    height: 165,
    depth: 50,
    box: 'small',
  },
};
