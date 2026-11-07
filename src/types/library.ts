export type CatalogGame = Omit<GameEntry, 'originalName' | 'shelfId'> & {
  bggType: 'base' | 'expansion';
};

export type GameBox = {
  id: string;
  contains: string[];
  shelfId: string;
  size: Exclude<BoxSize, 'none'>;
  dimensions?: BoxDimensions;
  updatedAt: number;
  relatedEntries?: string[];
} & ({ mainGameId: null; name: string } | { mainGameId?: never; name?: never });

export type LibraryContent = {
  games: Record<string, CatalogGame>;
  boxes: Record<string, GameBox>;
};

export type LegacyGame = Pick<CatalogGame, 'id' | 'name' | 'type' | 'image' | 'thumbnail'>;

export type LegacyLibrary = {
  shelves: Record<string, ShelfEntry>;
  images: Record<string, GameImages>;
};

export type Library = LibraryContent & {
  revision: string | null;
  legacy?: LegacyLibrary;
};

export type ImportPreview = {
  base: Library;
  next: LibraryContent;
  added: string[];
  changed: string[];
  removed: { id: string; name: string }[];
  released: string[];
};
