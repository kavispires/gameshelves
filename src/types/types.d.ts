// Object aliases
type PlainObject = Record<string, any>;
type BooleanDictionary = Record<string, boolean>;
type NumberDictionary = Record<string, number>;
type StringDictionary = Record<string, string>;
type ObjectDictionary = Record<string, PlainObject>;
type UnknownDictionary = Record<string, unknown>;
// Function aliases
type GenericFunction = (...args: any) => void;
type BooleanFunction = (...args: any) => boolean;

type GameId = string;
type GameStatus = 'OWN' | 'PREORDERED';
type LanguageDependence = 'Unknown' | 'Required' | 'Extensive' | 'Moderate' | 'Some' | 'None';
type GameType = 'base' | 'expansion' | 'promo' | 'upgrade' | 'accessory' | 'big-box' | 'unknown';
type BoxSize =
  | 'card'
  | 'x-small'
  | 'small'
  | 'medium'
  | 'regular'
  | 'large'
  | 'x-large'
  | 'big-box'
  | 'none'
  | 'unknown';
type BoxDimensions = {
  width: number;
  height: number;
  length: number;
};

interface GameEntry {
  /**
   * BGG Id
   */
  id: GameId;
  /**
   * Name of the board game item
   */
  name: string;
  /**
   * Original game of the board game item (I don't know what this is)
   */
  originalName: string;
  /**
   * Status in my collection
   */
  status: GameStatus;

  /**
   * The year of release
   */
  year: number;
  /**
   * The weight from 0 to 5
   */
  weight: number;

  /**
   * Minimum player count (can be zero)
   */
  minPlayerCount: number;
  /**
   * Maximum player count (can be zero)
   */
  maxPlayerCount: number;
  /**
   * Best player count, converted from '1,2,3,4' can be empty ''
   */
  bestWith: number[];
  /**
   * Recommended player count, , converted from '1,2,3,4' can be empty ''
   */
  recommendedPlayerCount: number[];
  /**
   * Minimum play time in minutes (can be zero)
   */
  minPlaytime: number;
  /**
   * Maximum play time in minutes (can be zero)
   */
  maxPlaytime: number;

  /**
   * Rank in BGG (can be zero)
   */
  rank?: number;
  /**
   * Average rating in BGG (can be zero)
   */
  rating?: number;
  /**
   * My rating in BGG (can be zero)
   */
  myRating?: number;
  /**
   * Game cover image url
   */
  image: string;
  /**
   * Game thumbnail image url
   */
  thumbnail: string;

  /**
   * Recommended age (can be empty)
   */
  recommendedAge?: string; // can be empty ''
  /**
   * Language Dependence
   */
  languageDependence: LanguageDependence;

  // CUSTOM DATA BELOW

  /**
   * Type of entry
   */
  type: GameType;
}

interface ShelfEntry {
  /**
   * BGG Id
   */
  id: GameId;
  /**
   * Name of the board game item (duplicated information)
   */
  name: string;
  /**
   * string with name and all contained names
   */
  searchQuery: string;
  /**
   * Game thumbnail image url (duplicated information)
   */
  thumbnail: string;
  /**
   * Shelf ID indicating where the game is located or 'unshelved'
   */
  shelfId: string;
  /**
   * The game box size (if any)
   */
  box: BoxSize;
  /**
   * Dimensions in mm when the game has a box
   */
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };

  /**
   * If the entry contains other items in its box, including itself (?)
   */
  contains?: GameId[];

  /**
   * Indicates if game has been shelved
   */
  shelved: boolean;

  /**
   * Timestamp when the entry was first added in milliseconds
   */
  createdAt: number;

  /**
   * Timestamp when the entry was first added in milliseconds
   */
  updatedAt: number;

  /**
   * Indicates if dimensions, type, and location (contains) are set
   */
  complete: boolean;
}
