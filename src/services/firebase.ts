import { type FirebaseApp, initializeApp } from 'firebase/app';
import {
  type Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import {
  collection,
  doc,
  type Firestore,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
} from 'firebase/firestore';
import { isEqual } from 'lodash';
import { GAME_TYPES } from 'utils/constants';
import { readFriends, usedAvatarIds, validateFriend } from 'utils/friends';
import { isGameImages, isRecord, isShelfEntry, normalizeShelfEntry } from 'utils/guards';
import { DOCUMENT_BUDGET, libraryDocuments, readLibrary, valueSize } from 'utils/library';
import type { Friend, FriendsState } from '../types/friends';
import type { LegacyGame, Library, LibraryContent } from '../types/library';

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const buildKey = () =>
  [required('VITE_FIREBASE_A'), required('VITE_FIREBASE_P'), required('VITE_FIREBASE_I')].join('');

const firebaseApp: FirebaseApp = initializeApp({
  apiKey: buildKey(),
  authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined,
  projectId: required('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: required('VITE_FIREBASE_API_ID'),
});

export const auth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
export default firebaseApp;

export function signUp(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOut(): Promise<void> {
  return auth.signOut();
}

async function getDictionary<T>(
  id: string,
  isEntry: (value: unknown) => value is T,
  normalize?: (value: unknown) => unknown,
): Promise<Record<string, T>> {
  const snapshot = await getDoc(doc(firestore, 'general', id));
  if (!snapshot.exists()) return {};
  return readDictionary(id, snapshot.data(), isEntry, normalize);
}

function readDictionary<T>(
  id: string,
  data: unknown,
  isEntry: (value: unknown) => value is T,
  normalize?: (value: unknown) => unknown,
): Record<string, T> {
  if (!isRecord(data)) throw new Error(`Invalid Firestore document: general/${id}`);
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(data)) {
    const entry = normalize ? normalize(value) : value;
    if (!isEntry(entry)) throw new Error(`Invalid entry ${key} in general/${id}`);
    result[key] = entry;
  }
  return result;
}

export const getShelvedGames = () => getDictionary('shelved-games', isShelfEntry, normalizeShelfEntry);
export const getImages = () => getDictionary('images', isGameImages);

/** Explicit first-import enrichment only, never a normal application-load query. */
export async function getLegacyGames(): Promise<Record<string, LegacyGame>> {
  const snapshot = await getDocs(collection(firestore, 'games'));
  const games: Record<string, LegacyGame> = {};
  for (const entry of snapshot.docs) {
    const data: unknown = entry.data();
    const type = isRecord(data) ? GAME_TYPES.find((type) => type === data.type) : undefined;
    if (
      !/^[1-9]\d*$/.test(entry.id) ||
      !isRecord(data) ||
      String(data.id) !== entry.id ||
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      !type ||
      !isGameImages(data)
    ) {
      throw new Error(`Migration blocked: invalid legacy game ${entry.id}. Resolve it before importing.`);
    }
    const images: GameImages = data;
    games[entry.id] = {
      id: entry.id,
      name: data.name,
      type,
      image: images.image ?? '',
      thumbnail: images.thumbnail ?? '',
    };
  }
  return games;
}

/** Two reads after migration. Legacy documents are read only while migration is pending. */
export async function getLibrary(): Promise<Library> {
  const [catalog, boxes] = await Promise.all([
    getDoc(doc(firestore, 'general', 'catalog')),
    getDoc(doc(firestore, 'general', 'boxes')),
  ]);
  if (!catalog.exists() && !boxes.exists()) {
    const [shelves, images] = await Promise.all([getShelvedGames(), getImages()]);
    return { revision: null, games: {}, boxes: {}, legacy: { shelves, images } };
  }
  return readLibrary(catalog.data(), boxes.data());
}

/** Revision checks make the approved preview the exact snapshot being replaced. */
export async function saveLibrary(expected: Library, content: LibraryContent): Promise<Library> {
  const revision = crypto.randomUUID();
  const documents = libraryDocuments(content, revision);
  const catalogRef = doc(firestore, 'general', 'catalog');
  const boxesRef = doc(firestore, 'general', 'boxes');
  await runTransaction(firestore, async (transaction) => {
    const [catalog, boxes] = await Promise.all([transaction.get(catalogRef), transaction.get(boxesRef)]);
    if (expected.revision === null) {
      if (catalog.exists() || boxes.exists() || !expected.legacy) {
        throw new Error('The library changed. Refresh the library and rebuild the preview.');
      }
      const [shelves, images] = await Promise.all([
        transaction.get(doc(firestore, 'general', 'shelved-games')),
        transaction.get(doc(firestore, 'general', 'images')),
      ]);
      const legacy = {
        shelves: shelves.exists()
          ? readDictionary('shelved-games', shelves.data(), isShelfEntry, normalizeShelfEntry)
          : {},
        images: images.exists() ? readDictionary('images', images.data(), isGameImages) : {},
      };
      if (!isEqual(expected.legacy, legacy)) {
        throw new Error(
          'Legacy organization changed. Refresh the library and rebuild the migration preview.',
        );
      }
    } else {
      const current = readLibrary(catalog.data(), boxes.data());
      if (current.revision !== expected.revision) {
        throw new Error('The library changed. Refresh the library and rebuild the preview.');
      }
    }
    transaction.set(catalogRef, documents.catalog);
    transaction.set(boxesRef, documents.boxes);
  });
  return { ...content, revision };
}

export async function getFriends(): Promise<FriendsState> {
  const snapshot = await getDoc(doc(firestore, 'general', 'friends'));
  return snapshot.exists() ? readFriends(snapshot.data()) : { revision: null, friends: {} };
}

export async function saveFriend(expected: FriendsState, friend: Friend): Promise<FriendsState> {
  validateFriend(friend);
  const revision = crypto.randomUUID();
  const friends = { ...expected.friends, [friend.id]: friend };
  const document = { schemaVersion: 1, revision, friends };
  if (valueSize(document) + 128 > DOCUMENT_BUDGET) {
    throw new Error('The friends document exceeds the 800 KiB safety budget. Nothing was saved.');
  }
  const reference = doc(firestore, 'general', 'friends');
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? readFriends(snapshot.data()) : { revision: null, friends: {} };
    if (current.revision !== expected.revision) {
      throw new Error(
        'Friends changed on another device. Cancel, reload friends and review your changes before saving.',
      );
    }
    if (usedAvatarIds(current.friends, friend.id).has(friend.avatarId)) {
      throw new Error('That avatar is already used by another friend. Choose a different avatar.');
    }
    transaction.set(reference, document);
  });
  return { revision, friends };
}
