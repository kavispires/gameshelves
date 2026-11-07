import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { csvRow, xmlRow } from '../../test/fixtures';
import type { BGGCollectionJson, MergedCollectionEntry } from '../../types/bgg';
import { parseCsvJson, parseXmlJson } from './importData';
import { mergeCollections, prepareRawGameShelfEntry, transformCSV, transformXML } from './utils';

describe('typed collection import', () => {
  it('preserves the existing fallback for XML entries without images', () => {
    expect(parseXmlJson(JSON.stringify({ item: [{ '@objectid': '2', '@subtype': 'boardgame' }] }))).toEqual([
      { id: '2', type: 'boardgame', image: '???', thumbnail: '???' },
    ]);
  });
  it('preserves owned/preordered filtering, key mapping and numeric/string ID matching', () => {
    const preorder: BGGCollectionJson = {
      ...csvRow,
      objectid: '3',
      own: 0,
      preordered: 1,
      numplays: null,
      quantity: null,
      version_yearpublished: null,
    };
    const csv = parseCsvJson(
      JSON.stringify([csvRow, preorder, { ...csvRow, objectid: 4, own: 0, preordered: 0 }]),
    );
    expect(csv.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: '2', status: 'OWN' },
      { id: '3', status: 'PREORDERED' },
    ]);
    const xml = parseXmlJson(JSON.stringify({ item: [xmlRow] }));
    const games = prepareRawGameShelfEntry(mergeCollections(transformCSV(csv), transformXML(xml)));
    expect(games[0]).toMatchObject({
      id: '2',
      name: 'Imported Game',
      minPlayerCount: 1,
      image: xmlRow.image,
      languageDependence: 'None',
    });
  });

  it('prepares CSV metadata without requiring a matching XML cover entry', () => {
    const entry: MergedCollectionEntry = parseCsvJson(JSON.stringify([csvRow]))[0];
    expect(prepareRawGameShelfEntry([entry])[0]).toMatchObject({
      id: '2',
      status: 'OWN',
      image: '???',
      thumbnail: '???',
    });
  });

  it.each(['{', '{}', '[null]', '[{"own":1,"preordered":0}]'])('rejects malformed CSV: %s', (json) => {
    expect(() => parseCsvJson(json)).toThrow();
  });

  it.each(['{', '[]', '{}', '{"item":[null]}', '{"item":[{"@objectid":"2"}]}'])(
    'rejects malformed XML: %s',
    (json) => {
      expect(() => parseXmlJson(json)).toThrow();
    },
  );

  it('continues to accept the checked-in converted collection formats', () => {
    const csv = parseCsvJson(readFileSync('public/assets/bgg-csv.json', 'utf8'));
    const xml = parseXmlJson(readFileSync('public/assets/bgg-xml.json', 'utf8'));
    expect(csv.length).toBeGreaterThan(0);
    expect(xml.length).toBeGreaterThan(0);
    expect(prepareRawGameShelfEntry(mergeCollections(transformCSV(csv), transformXML(xml)))).toHaveLength(
      new Set(csv.map((entry) => entry.id)).size,
    );
  });
});
