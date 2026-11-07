import { type FirebaseApp, initializeApp } from 'firebase/app';
import {
  type Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import { doc, type Firestore, getDoc, getFirestore, setDoc, writeBatch } from 'firebase/firestore';
import {
  isGameEntry,
  isGameImages,
  isRecord,
  isShelfEntry,
  normalizeLegacyId,
  normalizeShelfEntry,
} from 'utils/guards';

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
  const data: unknown = snapshot.data();
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

export async function getGame(id: GameId): Promise<GameEntry> {
  const snapshot = await getDoc(doc(firestore, 'games', id));
  if (!snapshot.exists()) throw new Error(`Game not found: ${id}`);
  const stored: unknown = snapshot.data();
  // The original CSV converter saved numeric game IDs despite the string domain type.
  const data = isRecord(stored) ? { ...stored, id: normalizeLegacyId(stored.id) } : stored;
  if (!isGameEntry(data)) throw new Error(`Invalid game document: ${id}`);
  return data;
}

export function saveShelvedGames(data: Record<string, ShelfEntry>, reset = false) {
  return setDoc(doc(firestore, 'general', 'shelved-games'), data, { merge: !reset });
}

export function saveImages(data: Record<string, GameImages>) {
  return setDoc(doc(firestore, 'general', 'images'), data, { merge: true });
}

export function saveGame(id: GameId, data: GameEntry) {
  return setDoc(doc(firestore, 'games', id), data, { merge: true });
}

export async function saveGames(games: GameEntry[]): Promise<void> {
  // Each attempt gets fresh batches; Firestore permits at most 500 writes per batch.
  for (let offset = 0; offset < games.length; offset += 500) {
    const batch = writeBatch(firestore);
    for (const game of games.slice(offset, offset + 500)) {
      batch.set(doc(firestore, 'games', game.id), game);
    }
    await batch.commit();
  }
}
