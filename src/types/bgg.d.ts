/**
 * Representation of what is output as a json when exporting a bgg collection from the user collection page
 */
interface BGGCollectionJson {
  objectname: string;
  objectid: GameId;
  rating: number;
  numplays: null;
  weight: number;
  own: number;
  fortrade: number;
  want: number;
  wanttobuy: number;
  wanttoplay: number;
  prevowned: number;
  preordered: number;
  wishlist: number;
  wishlistpriority: number;
  wishlistcomment: string;
  comment: string;
  conditiontext: string;
  haspartslist: string;
  wantpartslist: string;
  collid: number;
  baverage: number;
  average: number;
  avgweight: number;
  rank: number;
  numowned: number;
  objecttype: string; // thing
  originalname: string;
  minplayers: number;
  maxplayers: number;
  playingtime: number;
  maxplaytime: number;
  minplaytime: number;
  yearpublished: number;
  bggrecplayers: string;
  bggbestplayers: string;
  bggrecagerange: string;
  bgglanguagedependence: string;
  publisherid: string;
  imageid: string;
  year: string;
  language: string;
  other: string;
  itemtype: string;
  barcode: string;
  pricepaid: string;
  pp_currency: string;
  currvalue: string;
  cv_currency: string;
  acquisitiondate: string;
  acquiredfrom: string;
  quantity: null;
  privatecomment: string;
  invlocation: string;
  invdate: string;
  version_publishers: string;
  version_languages: string;
  version_yearpublished: null;
  version_nickname: string;
}

interface BGGCollection {
  rating: number;
  weight: number;
  bestWith: string;
  languageDependence: string;
  recommendedAge: string;
  recommendedPlayerCount: string;
  type: string;
  maxPlayerCount: number;
  collectionId: number;
  maxPlaytime: number;
  minPlayerCount: number;
  minPlaytime: number;
  id: GameId;
  name: string;
  originalName: string;
  rank: number;
  myRating: number;
  year: number;
  status: 'OWN' | 'PREORDERED' | string;
}

/**
 * Result from a parsed BGGXML
 */
interface BGGXml {
  '@pubdate': string;
  '@termsofuse': string;
  '@totalitems': string;
  item: BGGXmlEntry[];
}

/**
 * Each converted XML from BGG XML api
 */
interface BGGXmlEntry {
  '@objecttype': string;
  '@objectid': GameId;
  '@subtype': string;
  '@collid': string;
  name: {
    '@sortindex': string;
    '#text': string;
  };
  yearpublished: string;
  image: string;
  thumbnail: string;
  stats: {
    '@minplayers': string;
    '@maxplayers': string;
    '@minplaytime': string;
    '@maxplaytime': string;
    '@playingtime': string;
    '@numowned': string;
    rating: {
      '@value': string;
      usersrated: {
        '@value': string;
      };
      average: {
        '@value': string;
      };
      bayesaverage: {
        '@value': string;
      };
      stddev: {
        '@value': string;
      };
      median: {
        '@value': string;
      };
    };
  };
  status: {
    '@own': string;
    '@prevowned': string;
    '@fortrade': string;
    '@want': string;
    '@wanttoplay': string;
    '@wanttobuy': string;
    '@wishlist': string;
    '@preordered': string;
    '@lastmodified': string;
  };
  numplays: string;
}

interface XMLData {
  id: GameId;
  image: string;
  thumbnail: string;
  type: string;
}

type MergedCollectionEntry = XMLData & BGGCollection;
