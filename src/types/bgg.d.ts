/**
 * A collection row after the CSV-to-JSON converter coerces numeric cells.
 * Blank play counts, quantities, and version years may be null in legacy exports.
 */
export type BGGCollectionJson = {
  objectname: string;
  objectid: GameId | number;
  rating: number;
  numplays: number | null;
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
  quantity: number | null;
  privatecomment: string;
  invlocation: string;
  invdate: string;
  version_publishers: string;
  version_languages: string;
  version_yearpublished: number | null;
  version_nickname: string;
};

/**
 * An uncoerced CSV row: all 58 columns are text, including numeric and empty cells.
 */
export type BGGCollectionCsvRow = Record<keyof BGGCollectionJson, string>;

/**
 * Owned/preordered metadata in the legacy converted-JSON workflow.
 */
export type BGGCollection = {
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
  status: GameStatus;
};

/**
 * Result from a parsed BGGXML
 */
export interface BGGXml {
  '@pubdate': string;
  '@termsofuse': string;
  '@totalitems': string;
  item: BGGXmlEntry[];
}

/**
 * Each converted XML from BGG XML api
 */
export interface BGGXmlEntry {
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

export interface XMLData {
  id: GameId;
  image: string;
  thumbnail: string;
  type: string;
}

/**
 * CSV metadata with optional covers when no matching XML entry exists.
 */
export type MergedCollectionEntry = BGGCollection & Partial<Pick<XMLData, 'image' | 'thumbnail'>>;
