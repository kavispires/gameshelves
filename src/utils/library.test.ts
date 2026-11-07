import { describe, expect, it } from 'vitest';
import { catalogGame, library, promosLibrary, shelfEntry } from '../test/fixtures';
import type { Library } from '../types/library';
import {
  findBox,
  libraryDocuments,
  moveBoxes,
  prepareImport,
  projectShelves,
  readLibrary,
  updateBox,
} from './library';

describe('catalog and physical boxes', () => {
  it('moves original and standalone boxes atomically without changing games, contents or other box metadata', () => {
    const base: Library = {
      ...library,
      games: { ...library.games, '2': { ...catalogGame, id: '2' } },
      boxes: { ...library.boxes, promos: { ...promosLibrary.boxes.promos, contains: ['2'] } },
    };
    const next = moveBoxes(base, ['1', 'promos'], 'tv-cr-1');
    expect(next.games).toBe(base.games);
    for (const id of ['1', 'promos']) {
      expect(next.boxes[id]).toEqual({
        ...base.boxes[id],
        shelfId: 'tv-cr-1',
        updatedAt: expect.any(Number),
      });
      expect(base.boxes[id].shelfId).toBe('ew-cl-0');
    }
    expect(() => moveBoxes(base, ['1', 'missing'], 'tv-cr-1')).toThrow('Unknown box');
    expect(() => moveBoxes(base, ['1'], 'not-a-shelf')).toThrow('valid shelf');
    expect(() => moveBoxes({ ...base, revision: null }, ['1'], 'tv-cl-0')).toThrow('Migrate');
    expect(base.boxes['1'].shelfId).toBe('ew-cl-0');
  });

  it('migrates the promos shoe box without requiring a main BGG entry', () => {
    const base: Library = {
      revision: null,
      games: {},
      boxes: {},
      legacy: {
        images: {},
        shelves: {
          promos: {
            ...shelfEntry,
            id: 'promos',
            name: 'Promos shoe box',
            dimensions: { width: 300, height: 110, depth: 200 },
            contains: [{ id: '1', name: catalogGame.name, type: 'promo' }],
          },
        },
      },
    };
    const preview = prepareImport(base, { '1': catalogGame });
    expect(preview.next.boxes.promos).toMatchObject({
      id: 'promos',
      mainGameId: null,
      name: 'Promos shoe box',
      contains: ['1'],
      shelfId: shelfEntry.shelfId,
      dimensions: { width: 300, height: 110, depth: 200 },
      size: shelfEntry.box,
      updatedAt: shelfEntry.updatedAt,
    });
    expect(preview.next.games).not.toHaveProperty('promos');
    expect(preview.next.games['1'].type).toBe('promo');
  });

  it('keeps standalone containers on reimport, including when their last promo disappears', () => {
    const second = { ...catalogGame, id: '2', name: 'Other promo' };
    const base: Library = {
      ...promosLibrary,
      games: { ...promosLibrary.games, '2': second },
      boxes: { promos: { ...promosLibrary.boxes.promos, contains: ['1', '2'] } },
    };
    const preview = prepareImport(base, { '2': second });
    expect(preview.next.boxes.promos).toEqual({ ...promosLibrary.boxes.promos, contains: ['2'] });
    expect(preview.released).toEqual([]);
    const empty = prepareImport({ ...preview.next, revision: 'saved' }, { '3': { ...catalogGame, id: '3' } });
    expect(empty.next.boxes.promos).toEqual({ ...promosLibrary.boxes.promos, contains: [] });
    expect(empty.released).toEqual([]);
    const documents = libraryDocuments(empty.next, 'revision');
    expect(readLibrary(documents.catalog, documents.boxes).boxes.promos).toEqual(empty.next.boxes.promos);
  });

  it('projects named containers and edits all their contents without inventing a main game', () => {
    expect(projectShelves(promosLibrary).promos).toMatchObject({
      name: 'Promos shoe box',
      contains: [{ id: '1', type: 'promo' }],
    });
    const empty = updateBox(promosLibrary, 'promos', { ...promosLibrary.boxes.promos, contains: [] });
    expect(empty.boxes.promos.contains).toEqual([]);
    expect(empty.games).toEqual(promosLibrary.games);
    expect(() =>
      libraryDocuments({ ...library, boxes: { ...library.boxes, ...promosLibrary.boxes } }, 'r'),
    ).toThrow('assignment');
    expect(() =>
      libraryDocuments(
        {
          ...promosLibrary,
          boxes: { promos: { ...promosLibrary.boxes.promos, mainGameId: null, name: '' } },
        },
        'r',
      ),
    ).toThrow('Invalid box');
  });
  it('refreshes BGG facts while preserving manual types, covers, box contents, dimensions and locations', () => {
    const base: Library = {
      ...library,
      games: { '1': { ...catalogGame, type: 'promo' } },
      boxes: { '1': { ...library.boxes['1'], dimensions: { width: 300, height: 80, depth: 300 } } },
    };
    const preview = prepareImport(base, {
      '1': { ...catalogGame, name: 'New BGG name', type: 'base', image: '', thumbnail: '' },
      '2': { ...catalogGame, id: '2', name: 'New game' },
    });
    expect(preview.next.games['1']).toMatchObject({
      name: 'New BGG name',
      type: 'promo',
      image: catalogGame.image,
    });
    expect(preview.next.boxes).toEqual(base.boxes);
    expect(findBox(preview.next.boxes, '2')).toBeUndefined();
    expect(preview.added).toEqual(['2']);
    expect(base.games['1'].name).toBe('Test Game');
  });

  it('removes a missing main game and its box without deleting surviving contents', () => {
    const expansion = { ...catalogGame, id: '2', name: 'Expansion', type: 'expansion' as const };
    const base: Library = {
      ...library,
      games: { ...library.games, '2': expansion },
      boxes: { '1': { ...library.boxes['1'], contains: ['1', '2'] } },
    };
    const preview = prepareImport(base, { '2': expansion });
    expect(preview.removed).toEqual([{ id: '1', name: 'Test Game' }]);
    expect(preview.next.boxes).toEqual({});
    expect(preview.released).toEqual(['2']);
    expect(preview.next.games['2']).toBeDefined();
    expect(base.boxes['1'].contains).toEqual(['1', '2']);
    const removeExpansion = prepareImport(base, { '1': catalogGame });
    expect(removeExpansion.next.boxes['1'].contains).toEqual(['1']);
  });

  it('migrates known covers and manual classification without modifying legacy data', () => {
    const base: Library = {
      revision: null,
      games: {},
      boxes: {},
      legacy: {
        shelves: {
          '1': {
            ...shelfEntry,
            dimensions: { width: 10, height: 20, depth: 30 },
            contains: [{ ...shelfEntry.contains[0], type: 'promo' }],
          },
        },
        images: { '1': { image: 'known.jpg' } },
      },
    };
    const preview = prepareImport(base, { '1': catalogGame });
    expect(preview.next.games['1']).toMatchObject({ type: 'promo', image: 'known.jpg' });
    expect(preview.next.boxes['1']).toMatchObject({
      size: 'regular',
      shelfId: 'ew-cl-0',
      dimensions: { width: 10, height: 20, depth: 30 },
    });
    expect(base.legacy?.shelves['1'].contains[0].type).toBe('promo');
  });

  it('recovers per-game cover URLs and accounts for archived games missing from the shared shelf index', () => {
    const base: Library = {
      revision: null,
      games: {},
      boxes: {},
      legacy: { shelves: {}, images: { '1': { thumbnail: 'shared.jpg' } } },
    };
    const archived = {
      '1': {
        id: '1',
        name: 'Archived game',
        type: 'promo' as const,
        image: 'archived.jpg',
        thumbnail: '???',
      },
      '2': { id: '2', name: 'Removed archive', type: 'base' as const, image: '', thumbnail: '' },
    };
    const preview = prepareImport(base, { '1': catalogGame }, archived);
    expect(preview.next.games['1']).toMatchObject({
      type: 'promo',
      image: 'archived.jpg',
      thumbnail: 'shared.jpg',
    });
    expect(preview.added).toEqual([]);
    expect(preview.removed).toEqual([{ id: '2', name: 'Removed archive' }]);
  });

  it('blocks ambiguous legacy identity, duplicate assignments and partial measurements', () => {
    const migrate = (shelves: Record<string, ShelfEntry>) =>
      prepareImport(
        {
          revision: null,
          games: {},
          boxes: {},
          legacy: { shelves, images: {} },
        },
        { '1': catalogGame },
      );
    expect(() => migrate({ '2': shelfEntry })).toThrow('ambiguous');
    expect(() => migrate({ '2': { ...shelfEntry, id: '2' } })).toThrow('ambiguous');
    expect(() =>
      migrate({
        '1': shelfEntry,
        '2': {
          ...shelfEntry,
          id: '2',
          contains: [{ id: '2', name: 'Other', type: 'base' }, ...shelfEntry.contains],
        },
      }),
    ).toThrow('assigned more than once');
    expect(() => migrate({ '1': { ...shelfEntry, dimensions: { width: 10, height: 0, depth: 0 } } })).toThrow(
      'dimensions',
    );
  });

  it('preserves legacy unknown-size boxes and their relationships instead of guessing they do not exist', () => {
    const second = { ...catalogGame, id: '2', name: 'Other game' };
    const preview = prepareImport(
      {
        revision: null,
        games: {},
        boxes: {},
        legacy: {
          images: {},
          shelves: {
            '1': { ...shelfEntry, relatedEntries: ['2'] },
            '2': {
              ...shelfEntry,
              id: '2',
              name: second.name,
              box: 'unknown',
              shelfId: 'unshelved',
              contains: [{ id: '2', name: second.name, type: 'base' }],
            },
          },
        },
      },
      { '1': catalogGame, '2': second },
    );
    expect(preview.next.boxes['2']).toMatchObject({ size: 'unknown', contains: ['2'] });
    expect(preview.next.boxes['1'].relatedEntries).toEqual(['2']);
  });

  it('validates physical ownership and allows box removal without deleting any game', () => {
    expect(updateBox(library, '1', null)).toEqual({ games: library.games, boxes: {} });
    expect(() => updateBox(library, '1', { ...library.boxes['1'], contains: ['1', '1'] })).toThrow(
      'assignment',
    );
    expect(() => updateBox(library, '1', { ...library.boxes['1'], contains: [] })).toThrow('main game');
    expect(() =>
      updateBox(library, '1', { ...library.boxes['1'], dimensions: { width: 1, height: 0, depth: 1 } }),
    ).toThrow('Invalid box');
  });

  it('rejects oversized UTF-8 documents and mismatched or malformed persisted revisions', () => {
    expect(() =>
      libraryDocuments(
        { games: { '1': { ...catalogGame, name: '🎲'.repeat(220_000) } }, boxes: {} },
        'revision',
      ),
    ).toThrow('800 KiB');
    const documents = libraryDocuments(library, 'revision');
    expect(readLibrary(documents.catalog, documents.boxes)).toEqual({ ...library, revision: 'revision' });
    expect(() => readLibrary(documents.catalog, { ...documents.boxes, revision: 'stale' })).toThrow(
      'inconsistent',
    );
    expect(() =>
      readLibrary({ ...documents.catalog, games: { '1': { ...catalogGame, weight: NaN } } }, documents.boxes),
    ).toThrow('Invalid catalog');
  });
});
