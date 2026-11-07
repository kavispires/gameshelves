import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameEntry, shelfEntry } from '../test/fixtures';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn<() => Promise<void>>(),
  commit: vi.fn<() => Promise<void>>(),
  writeBatch: vi.fn(),
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
  setDoc: sdk.setDoc,
  writeBatch: sdk.writeBatch,
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
  sdk.commit.mockResolvedValue();
  sdk.setDoc.mockResolvedValue();
  sdk.writeBatch.mockImplementation(() => ({ set: vi.fn(), commit: sdk.commit }));
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

  it('keeps merge and replacement writes distinct, including empty replacement', async () => {
    const service = await import('./firebase');
    const data = { '1': shelfEntry };
    await service.saveShelvedGames(data);
    await service.saveShelvedGames({}, true);
    await service.saveImages({ '1': { thumbnail: 'image.jpg' } });
    await service.saveGame('1', gameEntry);
    expect(sdk.setDoc.mock.calls).toEqual([
      ['general/shelved-games', data, { merge: true }],
      ['general/shelved-games', {}, { merge: false }],
      ['general/images', { '1': { thumbnail: 'image.jpg' } }, { merge: true }],
      ['games/1', gameEntry, { merge: true }],
    ]);
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

  it('rebuilds batches after failure and on repeated saves', async () => {
    const { saveGames } = await import('./firebase');
    sdk.commit.mockRejectedValueOnce(new Error('offline'));
    await expect(saveGames([gameEntry])).rejects.toThrow('offline');
    await saveGames([gameEntry]);
    await saveGames([gameEntry]);
    expect(sdk.writeBatch).toHaveBeenCalledTimes(3);
    const batches = sdk.writeBatch.mock.results.map(({ value }) => value);
    expect(new Set(batches).size).toBe(3);
  });

  it('reads legacy numeric game IDs without changing stored documents', async () => {
    const { getGame } = await import('./firebase');
    sdk.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ ...gameEntry, id: 1 }) });
    await expect(getGame('1')).resolves.toEqual(gameEntry);
    expect(sdk.setDoc).not.toHaveBeenCalled();
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
    expect(sdk.setDoc).not.toHaveBeenCalled();
  });

  it('splits large collections into batches within the Firestore limit', async () => {
    const { saveGames } = await import('./firebase');
    await saveGames(Array.from({ length: 501 }, (_, index) => ({ ...gameEntry, id: String(index) })));
    expect(sdk.writeBatch).toHaveBeenCalledTimes(2);
    expect(sdk.writeBatch.mock.results[0].value.set).toHaveBeenCalledTimes(500);
    expect(sdk.writeBatch.mock.results[1].value.set).toHaveBeenCalledTimes(1);
    expect(sdk.commit).toHaveBeenCalledTimes(2);
  });
});
