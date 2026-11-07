import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { csvRow } from '../../test/fixtures';
import { parseCollectionCsv } from './importCsv';

describe('direct BGG CSV import', () => {
  it('handles BOM, CRLF, quoted commas/newlines, duplicate collection rows and the owned/preordered scope', () => {
    const csv = Papa.unparse([
      { ...csvRow, objectname: 'Game, "deluxe"\nEdition', comment: 'Ignored\nprivate comment' },
      { ...csvRow, objectname: 'Game, "deluxe"\nEdition', collid: 456 },
      { ...csvRow, objectid: 3, own: 0, preordered: 1 },
      { ...csvRow, objectid: 4, own: 0 },
    ]);
    const games = parseCollectionCsv(`\uFEFF${csv}`);
    expect(Object.keys(games)).toEqual(['2', '3']);
    expect(games['2']).toMatchObject({
      name: 'Game, "deluxe"\nEdition',
      status: 'OWN',
      type: 'base',
      bestWith: [2],
      recommendedPlayerCount: [1, 2, 3, 4],
      languageDependence: 'None',
      weight: 2,
      rating: 7,
      myRating: 8,
    });
    expect(games['2']).not.toHaveProperty('comment');
    expect(games['2']).not.toHaveProperty('shelfId');
    expect(games['3'].status).toBe('PREORDERED');
  });

  it('keeps unknown numeric metadata and player recommendations usable', () => {
    const games = parseCollectionCsv(
      Papa.unparse([{ ...csvRow, rank: '', average: '', bggbestplayers: '', itemtype: 'expansion' }]),
    );
    expect(games['2']).toMatchObject({ rank: 0, rating: 0, bestWith: [], bggType: 'expansion' });
  });

  it('rejects conflicting duplicates rather than choosing whichever row is last', () => {
    expect(() => parseCollectionCsv(Papa.unparse([csvRow, { ...csvRow, rating: 9 }]))).toThrow(
      'conflicting rows',
    );
  });

  it.each([
    ['missing columns', 'objectid,objectname\n2,Game'],
    ['duplicate headers', 'objectid,objectid\n2,2'],
    ['empty collection', Papa.unparse([{ ...csvRow, own: 0 }])],
    ['invalid ownership', Papa.unparse([{ ...csvRow, own: '' }])],
    ['invalid metadata', Papa.unparse([{ ...csvRow, maxplayers: 'oops' }])],
    ['missing name', Papa.unparse([{ ...csvRow, objectname: '' }])],
    ['unsafe ID', Papa.unparse([{ ...csvRow, objectid: '__proto__' }])],
    ['truncated row', `${Papa.unparse([csvRow])}\r\n2,partial`],
    ['unclosed quote', `${Papa.unparse([csvRow])}\r\n"broken`],
  ])('blocks %s without yielding a partial catalog', (_name, csv) => {
    expect(() => parseCollectionCsv(csv)).toThrow();
  });
});
