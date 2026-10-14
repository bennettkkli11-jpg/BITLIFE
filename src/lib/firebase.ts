import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Character, PastLifeRecord, DailyStreakData } from '../types/bitlife';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with databaseId as required by AI Studio guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Skill Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as required by SKILL.md
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
    }
    return false;
  }
}

// Auth Actions
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create or update user profile document
    const userRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Player',
        photoUrl: user.photoURL || '',
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    return user;
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export const GUEST_SESSION_KEY = 'bitlife_guest_session_v1';
export const GUEST_SAVE_KEY = 'bitlife_guest_char_save_v1';
export const GUEST_PAST_LIVES_KEY = 'bitlife_guest_past_lives_v1';

export const RANDOM_GUEST_NAMES = [
  'Guest_SimMaster',
  'Guest_Tycoon',
  'Guest_DamaLover',
  'Guest_Maverick',
  'Guest_Phoenix',
  'Guest_Speedrunner',
  'Guest_BitLifer',
  'Guest_LuckyStreak',
  'Guest_Challenger',
  'Guest_HighRoller',
];

export function generateRandomGuestName(): string {
  const base = RANDOM_GUEST_NAMES[Math.floor(Math.random() * RANDOM_GUEST_NAMES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${base}_${num}`;
}

export interface GuestSession {
  uid: string;
  displayName: string;
  email: string;
  isAnonymous: boolean;
  photoURL: string | null;
  createdAt: string;
}

// Custom listener for guest login/logout state changes
type AuthStateListener = (user: FirebaseUser | GuestSession | null) => void;
const customAuthListeners: Set<AuthStateListener> = new Set();

export function onAppAuthStateChange(callback: AuthStateListener): () => void {
  customAuthListeners.add(callback);

  // Also bind Firebase auth state change
  const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(firebaseUser);
    } else {
      const guest = getLocalGuestSession();
      callback(guest);
    }
  });

  return () => {
    customAuthListeners.delete(callback);
    unsubscribeFirebase();
  };
}

export function notifyAuthListenersExport(user: FirebaseUser | GuestSession | null) {
  notifyAuthListeners(user);
}

function notifyAuthListeners(user: FirebaseUser | GuestSession | null) {
  customAuthListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.error('Auth listener error', e);
    }
  });
}

export function getLocalGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {}
}

export async function signInAsGuest(customName?: string): Promise<GuestSession> {
  const chosenName = customName?.trim() || generateRandomGuestName();
  const now = new Date().toISOString();
  const guestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const guestEmail = `${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '_')}@temporary.bitlife`;

  // Create or sync Firestore user profile document (permitted by firestore.rules)
  try {
    const userRef = doc(db, 'users', guestUid);
    await setDoc(
      userRef,
      {
        id: guestUid,
        email: guestEmail,
        displayName: chosenName,
        photoUrl: '',
        isAnonymous: true,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );
  } catch (fsErr) {
    console.warn('Guest Firestore doc notice:', fsErr);
  }

  const session: GuestSession = {
    uid: guestUid,
    displayName: chosenName,
    email: guestEmail,
    isAnonymous: true,
    photoURL: null,
    createdAt: now,
  };

  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  notifyAuthListeners(session);
  return session;
}

export async function signOutUser(): Promise<void> {
  clearGuestSession();
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    notifyAuthListeners(null);
  } catch (error) {
    console.error('Sign Out failed:', error);
    notifyAuthListeners(null);
    throw error;
  }
}

// Canonical account identifier for cross-device synchronization
export function sanitizeDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

export function getActiveUserSyncInfo(): {
  email: string | null;
  docId: string | null;
  authUid: string | null;
  displayName: string | null;
} {
  const user = auth.currentUser;
  const guest = getLocalGuestSession();
  const rawEmail = (user?.email || guest?.email || '').trim().toLowerCase();
  const email = rawEmail || null;
  const docId = rawEmail ? sanitizeDocId(rawEmail) : null;
  const authUid = user?.uid || guest?.uid || docId || null;
  const displayName = user?.displayName || guest?.displayName || (email ? email.split('@')[0] : 'Player');
  return { email, docId, authUid, displayName };
}

// Cloud Save Character - writes to both canonical Account and user profile for 100% cross-device reliability
export async function saveCharacterToCloud(character: Character): Promise<void> {
  const syncInfo = getActiveUserSyncInfo();
  const now = new Date().toISOString();
  const serialized = JSON.stringify(character);

  // Always update local storage as reliable local cache
  try {
    localStorage.setItem(GUEST_SAVE_KEY, serialized);
    localStorage.setItem('bitlife_character_data', serialized);
  } catch {}

  // If no email or user token exists yet, local save was stored
  if (!syncInfo.docId && !auth.currentUser) {
    return;
  }

  const writePromises: Promise<any>[] = [];

  // 1. Cross-Device Canonical Account Document & Subcollection
  // Identifies user across phone, desktop, laptop, or other browsers
  if (syncInfo.docId) {
    const accountDocRef = doc(db, 'accounts', syncInfo.docId);
    const subSaveRef = doc(db, 'accounts', syncInfo.docId, 'saves', 'current');

    writePromises.push(
      setDoc(
        subSaveRef,
        {
          id: 'current',
          userId: syncInfo.docId,
          name: `${character.firstName} ${character.lastName}`.trim().slice(0, 100) || 'Player',
          age: Number(character.age) || 0,
          bankBalance: Number(character.money) || 0,
          netWorth: Number(character.money) || 0,
          characterData: serialized,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      ).catch((err) => console.warn('Account sub-save sync notice:', err))
    );

    writePromises.push(
      setDoc(
        accountDocRef,
        {
          characterData: serialized,
          characterName: `${character.firstName} ${character.lastName}`.trim().slice(0, 100) || 'Player',
          characterAge: Number(character.age) || 0,
          characterMoney: Number(character.money) || 0,
          characterUpdatedAt: now,
          updatedAt: now,
        },
        { merge: true }
      ).catch((err) => console.warn('Account root save sync notice:', err))
    );
  }

  // 2. Standard Firebase Auth User Profile Save
  if (auth.currentUser) {
    const userSaveRef = doc(db, 'users', auth.currentUser.uid, 'saves', 'current');
    writePromises.push(
      setDoc(
        userSaveRef,
        {
          id: 'current',
          userId: auth.currentUser.uid,
          name: `${character.firstName} ${character.lastName}`.trim().slice(0, 100) || 'Player',
          age: Number(character.age) || 0,
          bankBalance: Number(character.money) || 0,
          netWorth: Number(character.money) || 0,
          characterData: serialized,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      ).catch((err) => console.warn('User sub-save sync notice:', err))
    );
  }

  await Promise.allSettled(writePromises);
}

// Load Character from Cloud across devices
export async function loadCharacterFromCloud(): Promise<Character | null> {
  const syncInfo = getActiveUserSyncInfo();

  // 1. Canonical Account document / subcollection check (exact cross-device identity match)
  if (syncInfo.docId) {
    try {
      const subSnap = await getDoc(doc(db, 'accounts', syncInfo.docId, 'saves', 'current'));
      if (subSnap.exists() && subSnap.data()?.characterData) {
        const char = JSON.parse(subSnap.data().characterData);
        try {
          localStorage.setItem(GUEST_SAVE_KEY, subSnap.data().characterData);
          localStorage.setItem('bitlife_character_data', subSnap.data().characterData);
        } catch {}
        return char;
      }
    } catch (e) {
      console.warn('Account sub-save check notice:', e);
    }

    try {
      const accSnap = await getDoc(doc(db, 'accounts', syncInfo.docId));
      if (accSnap.exists() && accSnap.data()?.characterData) {
        const char = JSON.parse(accSnap.data().characterData);
        try {
          localStorage.setItem(GUEST_SAVE_KEY, accSnap.data().characterData);
          localStorage.setItem('bitlife_character_data', accSnap.data().characterData);
        } catch {}
        return char;
      }
    } catch (e) {
      console.warn('Account root save check notice:', e);
    }
  }

  // 2. Standard Firebase Auth User Save check
  if (auth.currentUser) {
    try {
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'saves', 'current'));
      if (userSnap.exists() && userSnap.data()?.characterData) {
        const char = JSON.parse(userSnap.data().characterData);
        try {
          localStorage.setItem(GUEST_SAVE_KEY, userSnap.data().characterData);
          localStorage.setItem('bitlife_character_data', userSnap.data().characterData);
        } catch {}
        return char;
      }
    } catch (e) {
      console.warn('User sub-save check notice:', e);
    }
  }

  // 3. Fallback to Local Storage
  try {
    const raw = localStorage.getItem(GUEST_SAVE_KEY) || localStorage.getItem('bitlife_character_data');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Live real-time Firestore synchronization across all devices
export function subscribeToCharacterCloudSync(
  onSync: (character: Character, updatedAt: string) => void
): () => void {
  const syncInfo = getActiveUserSyncInfo();
  if (!syncInfo.docId) {
    return () => {};
  }

  const unsubAccount = onSnapshot(
    doc(db, 'accounts', syncInfo.docId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.characterData && data?.characterUpdatedAt) {
          try {
            const char = JSON.parse(data.characterData);
            onSync(char, data.characterUpdatedAt);
          } catch {}
        }
      }
    },
    (err) => console.warn('Account live character sync notice:', err)
  );

  return () => {
    unsubAccount();
  };
}

// Save Past Life to Graveyard across devices
export async function savePastLifeToCloud(record: PastLifeRecord): Promise<void> {
  const syncInfo = getActiveUserSyncInfo();
  const now = new Date().toISOString();

  // Local cache backup
  try {
    const raw = localStorage.getItem(GUEST_PAST_LIVES_KEY);
    const list: PastLifeRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(GUEST_PAST_LIVES_KEY, JSON.stringify(list.slice(0, 50)));
    localStorage.setItem('bitlife_past_lives', JSON.stringify(list.slice(0, 50)));
  } catch {}

  const writePromises: Promise<any>[] = [];

  const recordPayload = {
    id: record.id,
    userId: syncInfo.docId || auth.currentUser?.uid || 'player',
    name: (record.fullName || 'Unknown').slice(0, 100),
    age: Number(record.age) || 0,
    netWorth: Number(record.netWorth) || 0,
    ribbon: (record.ribbon || 'Mediocre').slice(0, 64),
    causeOfDeath: (record.causeOfDeath || 'Peaceful sleep').slice(0, 250),
    epitaph: `Here lies ${record.fullName}, age ${record.age}`.slice(0, 300),
    recordData: JSON.stringify(record),
    createdAt: now,
  };

  // Cross-device Canonical Account Past Lives collection
  if (syncInfo.docId) {
    writePromises.push(
      setDoc(doc(db, 'accounts', syncInfo.docId, 'pastLives', record.id), recordPayload, {
        merge: true,
      }).catch((e) => console.warn('Account past life write notice:', e))
    );
  }

  // Firebase Auth UID past lives collection
  if (auth.currentUser) {
    writePromises.push(
      setDoc(doc(db, 'users', auth.currentUser.uid, 'pastLives', record.id), recordPayload, {
        merge: true,
      }).catch((e) => console.warn('User past life write notice:', e))
    );
  }

  await Promise.allSettled(writePromises);
}

// Load Past Lives from Cloud across devices
export async function loadPastLivesFromCloud(): Promise<PastLifeRecord[]> {
  const syncInfo = getActiveUserSyncInfo();
  const recordsMap = new Map<string, PastLifeRecord>();

  // 1. From local storage cache
  try {
    const raw = localStorage.getItem(GUEST_PAST_LIVES_KEY) || localStorage.getItem('bitlife_past_lives');
    if (raw) {
      const list: PastLifeRecord[] = JSON.parse(raw);
      list.forEach((r) => recordsMap.set(r.id, r));
    }
  } catch {}

  // 2. From canonical account past lives
  if (syncInfo.docId) {
    try {
      const snap = await getDocs(collection(db, 'accounts', syncInfo.docId, 'pastLives'));
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d?.recordData) {
          try {
            recordsMap.set(d.id, JSON.parse(d.recordData));
          } catch {}
        } else {
          recordsMap.set(d.id, {
            id: d.id,
            fullName: d.name || 'Unknown',
            age: d.age || 0,
            gender: 'Male',
            country: 'Saved Life',
            city: 'Cemetery',
            flag: '🪦',
            netWorth: d.netWorth || 0,
            causeOfDeath: d.causeOfDeath || 'Peaceful sleep',
            ribbon: d.ribbon || 'Mediocre',
            loversCount: 0,
            childrenCount: 0,
            career: 'Completed Life',
            dateCompleted: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Past',
          });
        }
      });
    } catch (e) {
      console.warn('Account past lives load notice:', e);
    }
  }

  // 3. From user auth past lives
  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'pastLives'));
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (!recordsMap.has(d.id)) {
          if (d?.recordData) {
            try {
              recordsMap.set(d.id, JSON.parse(d.recordData));
            } catch {}
          } else {
            recordsMap.set(d.id, {
              id: d.id,
              fullName: d.name || 'Unknown',
              age: d.age || 0,
              gender: 'Male',
              country: 'Saved Life',
              city: 'Cemetery',
              flag: '🪦',
              netWorth: d.netWorth || 0,
              causeOfDeath: d.causeOfDeath || 'Peaceful sleep',
              ribbon: d.ribbon || 'Mediocre',
              loversCount: 0,
              childrenCount: 0,
              career: 'Completed Life',
              dateCompleted: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Past',
            });
          }
        }
      });
    } catch (e) {
      console.warn('User past lives load notice:', e);
    }
  }

  const results = Array.from(recordsMap.values());
  try {
    localStorage.setItem(GUEST_PAST_LIVES_KEY, JSON.stringify(results.slice(0, 50)));
    localStorage.setItem('bitlife_past_lives', JSON.stringify(results.slice(0, 50)));
  } catch {}
  return results;
}

// Save Daily Streak across devices
export async function saveDailyStreakToCloud(streakData: DailyStreakData): Promise<void> {
  const syncInfo = getActiveUserSyncInfo();
  if (!syncInfo.docId) return;

  try {
    await setDoc(
      doc(db, 'accounts', syncInfo.docId),
      {
        streakData: JSON.stringify(streakData),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Daily streak cloud save notice:', err);
  }
}

// Load Daily Streak across devices
export async function loadDailyStreakFromCloud(): Promise<DailyStreakData | null> {
  const syncInfo = getActiveUserSyncInfo();
  if (!syncInfo.docId) return null;

  try {
    const snap = await getDoc(doc(db, 'accounts', syncInfo.docId));
    if (snap.exists() && snap.data()?.streakData) {
      return JSON.parse(snap.data().streakData);
    }
  } catch (err) {
    console.warn('Daily streak cloud load notice:', err);
  }
  return null;
}

