export const shelfEntry: ShelfEntry = {
  id: '1',
  name: 'Test Game',
  shelfId: 'ew-cl-0',
  box: 'regular',
  contains: [{ id: '1', name: 'Test Game', type: 'base' }],
  updatedAt: 1,
  complete: false,
};

export const gameEntry: GameEntry = {
  id: '1',
  name: 'Test Game',
  originalName: '',
  status: 'OWN',
  year: 2020,
  weight: 2,
  minPlayerCount: 1,
  maxPlayerCount: 4,
  bestWith: [2],
  recommendedPlayerCount: [1, 2, 3, 4],
  minPlaytime: 30,
  maxPlaytime: 60,
  image: 'https://example.com/image.jpg',
  thumbnail: 'https://example.com/thumbnail.jpg',
  languageDependence: 'None',
  type: 'base',
  shelfId: 'unshelved',
};

export const csvRow = {
  objectid: 2,
  objectname: 'Imported Game',
  originalname: '',
  own: 1,
  preordered: 0,
  average: 7,
  avgweight: 2,
  bggbestplayers: '2',
  bgglanguagedependence: 'No necessary in-game text',
  bggrecagerange: '10+',
  bggrecplayers: '1,2,3,4',
  itemtype: 'base',
  maxplayers: 4,
  collid: 123,
  maxplaytime: 60,
  minplayers: 1,
  minplaytime: 30,
  rank: 1,
  rating: 8,
  yearpublished: 2020,
};

export const xmlRow = {
  '@objectid': '2',
  '@subtype': 'boardgame',
  image: 'https://example.com/image.jpg',
  thumbnail: 'https://example.com/thumbnail.jpg',
};
