import { beforeEach, describe, expect, it, vi } from 'vitest';
import { library, shelfEntry } from '../test/fixtures';
import { libraryDocuments } from '../utils/library';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({})),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn(),
  transactionSet: vi.fn(),
}));

vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db: unknown, path: string, id: string) => `${path}/${id}`),
  getDoc: sdk.getDoc,
  getDocs: sdk.getDocs,
  collection: vi.fn((_db: unknown, path: string) => path),
  runTransaction: sdk.runTransaction,
}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  for (const name of [
    'A',
    'P',
    'I',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'API_ID',
  ]) {
    vi.stubEnv(`VITE_FIREBASE_${name}`, `test-${name}`);
  }
  sdk.runTransaction.mockImplementation(async (_db, update) =>
    update({ get: sdk.getDoc, set: sdk.transactionSet }),
  );
});

describe('atomic aggregate library persistence', () => {
  function snapshots(revision = library.revision ?? '') {
    const documents = libraryDocuments(library, revision);
    sdk.getDoc.mockImplementation(async (path: string) => ({
      exists: () => true,
      data: () => (path === 'general/catalog' ? documents.catalog : documents.boxes),
    }));
  }

  it('loads exactly two aggregate documents and does not read legacy data after migration', async () => {
    const { getLibrary } = await import('./firebase');
    snapshots();
    await expect(getLibrary()).resolves.toEqual(library);
    expect(sdk.getDoc.mock.calls).toEqual([['general/catalog'], ['general/boxes']]);
    expect(sdk.transactionSet).not.toHaveBeenCalled();
  });

  it('keeps pre-migration reads read-only and refuses partially migrated data', async () => {
    const { getLibrary } = await import('./firebase');
    sdk.getDoc.mockImplementation(async () => ({ exists: () => false, data: () => undefined }));
    await expect(getLibrary()).resolves.toEqual({
      revision: null,
      games: {},
      boxes: {},
      legacy: { shelves: {}, images: {} },
    });
    expect(sdk.transactionSet).not.toHaveBeenCalled();
    sdk.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ schemaVersion: 1 }) });
    await expect(getLibrary()).rejects.toThrow('inconsistent');
  });

  it('atomically replaces both maps using one shared new revision', async () => {
    const { saveLibrary } = await import('./firebase');
    snapshots();
    const next = { games: library.games, boxes: {} };
    const result = await saveLibrary(library, next);
    expect(result.revision).not.toBe(library.revision);
    expect(sdk.transactionSet.mock.calls).toEqual([
      ['general/catalog', { schemaVersion: 1, revision: result.revision, games: library.games }],
      ['general/boxes', { schemaVersion: 1, revision: result.revision, boxes: {} }],
    ]);
  });

  it('rejects stale approvals and oversized writes without scheduling either write', async () => {
    const { saveLibrary } = await import('./firebase');
    snapshots('other-device');
    await expect(saveLibrary(library, library)).rejects.toThrow('library changed');
    expect(sdk.transactionSet).not.toHaveBeenCalled();
    sdk.getDoc.mockClear();
    await expect(
      saveLibrary(library, {
        games: { '1': { ...library.games['1'], name: 'a'.repeat(900_000) } },
        boxes: {},
      }),
    ).rejects.toThrow('800 KiB');
    expect(sdk.getDoc).not.toHaveBeenCalled();
  });

  it('checks legacy organization in the migration transaction and never writes legacy paths', async () => {
    const { saveLibrary } = await import('./firebase');
    const base = {
      revision: null,
      games: {},
      boxes: {},
      legacy: { shelves: { '1': shelfEntry }, images: {} },
    };
    sdk.getDoc.mockImplementation(async (path: string) => ({
      exists: () => path === 'general/shelved-games',
      data: () => (path === 'general/shelved-games' ? { '1': shelfEntry } : undefined),
    }));
    await saveLibrary(base, library);
    expect(sdk.transactionSet.mock.calls.map(([path]) => path)).toEqual(['general/catalog', 'general/boxes']);
    sdk.transactionSet.mockClear();
    sdk.getDoc.mockImplementation(async () => ({ exists: () => false, data: () => undefined }));
    await expect(saveLibrary(base, library)).rejects.toThrow('Legacy organization changed');
    expect(sdk.transactionSet).not.toHaveBeenCalled();
  });

  it('recovers archived covers/classification explicitly without including unused metadata', async () => {
    const { getLegacyGames } = await import('./firebase');
    sdk.getDocs.mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({
            id: 1,
            name: 'Archived game',
            type: 'promo',
            image: 'archived.jpg',
            privateComment: 'discard',
          }),
        },
      ],
    });
    await expect(getLegacyGames()).resolves.toEqual({
      '1': { id: '1', name: 'Archived game', type: 'promo', image: 'archived.jpg', thumbnail: '' },
    });
    expect(sdk.getDocs).toHaveBeenCalledWith('games');
    expect(sdk.transactionSet).not.toHaveBeenCalled();
    sdk.getDocs.mockResolvedValue({ docs: [{ id: '1', data: () => ({ name: 'invalid' }) }] });
    await expect(getLegacyGames()).rejects.toThrow('invalid legacy game');
  });
});

describe('Firebase service migration', () => {
  it('assembles the reference key convention and reports missing configuration', async () => {
    await import('./firebase');
    expect(sdk.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'test-Atest-Ptest-I', projectId: 'test-PROJECT_ID' }),
    );
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    await expect(import('./firebase')).rejects.toThrow('VITE_FIREBASE_PROJECT_ID');
  });

  it('allows absent dictionaries but propagates permission failures and malformed data', async () => {
    const { getShelvedGames } = await import('./firebase');
    sdk.getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(getShelvedGames()).resolves.toEqual({});
    sdk.getDoc.mockRejectedValueOnce(new Error('permission-denied'));
    await expect(getShelvedGames()).rejects.toThrow('permission-denied');
    sdk.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ '1': { name: 'invalid' } }) });
    await expect(getShelvedGames()).rejects.toThrow('Invalid entry');
    sdk.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ '1': shelfEntry }) });
    await expect(getShelvedGames()).resolves.toEqual({ '1': shelfEntry });
  });

  it('reads legacy numeric shelf and contained IDs without modifying stored data', async () => {
    const stored = {
      ...shelfEntry,
      id: 559,
      contains: [{ id: 559, name: 'Test Game', type: 'base' }],
      relatedEntries: [123, '456'],
    };
    const { getShelvedGames } = await import('./firebase');
    sdk.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ '559': stored }) });
    await expect(getShelvedGames()).resolves.toEqual({
      '559': {
        ...stored,
        id: '559',
        contains: [{ id: '559', name: 'Test Game', type: 'base' }],
        relatedEntries: ['123', '456'],
      },
    });
    expect(stored.id).toBe(559);
    expect(stored.contains[0].id).toBe(559);
    expect(stored.relatedEntries).toEqual([123, '456']);
    expect(sdk.transactionSet).not.toHaveBeenCalled();
  });
});
