import {
  db,
  auth,
  getLocalGuestSession,
  GUEST_SESSION_KEY,
  notifyAuthListenersExport,
  GuestSession,
} from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';


export interface AccountRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin' | 'sysop';
  lastLoginAt: string;
  lastDevice: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginAuditRecord {
  id: string;
  email: string;
  action: 'login' | 'register' | 'password_change' | 'admin_override' | 'bulk_password_reset';
  device: string;
  ip: string;
  success: boolean;
  timestamp: string;
}

export const SYSTOPS_MASTER_PASSWORD = 'punahou';

export function verifySystopsPassword(input: string): boolean {
  if (!input) return false;
  return input.trim().toLowerCase() === SYSTOPS_MASTER_PASSWORD;
}

export function sanitizeDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

export function getClientDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Device';
  if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

const LOCAL_ACCOUNTS_KEY = 'bitlife_cross_device_accounts_cache_v1';
const LOCAL_LOGINS_KEY = 'bitlife_cross_device_logins_cache_v1';

export function getCachedAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheAccounts(accounts: AccountRecord[]) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export function getCachedLogins(): LoginAuditRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheLogins(logins: LoginAuditRecord[]) {
  try {
    localStorage.setItem(LOCAL_LOGINS_KEY, JSON.stringify(logins));
  } catch {}
}

/**
 * Record a login/auth event into Firestore collection 'logins'
 */
export async function recordLoginEvent(
  email: string,
  action: 'login' | 'register' | 'password_change' | 'admin_override' | 'bulk_password_reset',
  success: boolean
): Promise<void> {
  const now = new Date().toISOString();
  const id = `login_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: LoginAuditRecord = {
    id,
    email: email.trim().toLowerCase(),
    action,
    device: getClientDeviceInfo(),
    ip: '127.0.0.1 (Web Cloud)',
    success,
    timestamp: now,
  };

  // Update local cache
  const cached = getCachedLogins();
  cached.unshift(record);
  cacheLogins(cached.slice(0, 100));

  try {
    const loginRef = doc(db, 'logins', id);
    await setDoc(loginRef, record);
  } catch (err) {
    console.warn('Could not write to Firestore logins collection:', err);
  }
}

/**
 * Ensure user session display information is set
 */
async function ensureFirebaseAuthSession(displayName: string, email: string): Promise<void> {
  // Session is fully managed by cross-device Firestore account records and local active session
}

/**
 * Perform high-reliability email login & register with cross-device Firestore sync
 */
export async function signInWithEmailAccount(
  rawEmail: string,
  rawPass: string,
  mode: 'login' | 'register' | 'auto' = 'auto'
): Promise<{ success: boolean; message: string; isNewUser: boolean; account: AccountRecord }> {
  const email = rawEmail.trim().toLowerCase();
  const password = rawPass.trim();

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address (e.g. player@domain.com).');
  }
  if (!password || password.length < 3) {
    throw new Error('Password must be at least 3 characters.');
  }

  const docId = sanitizeDocId(email);
  const now = new Date().toISOString();
  const device = getClientDeviceInfo();
  const accountRef = doc(db, 'accounts', docId);

  let existingAccount: AccountRecord | null = null;

  // 1. Check if account already exists in Cloud Firestore
  try {
    const snap = await getDoc(accountRef);
    if (snap.exists()) {
      existingAccount = snap.data() as AccountRecord;
    }
  } catch (err) {
    console.warn('Cloud accounts check fallback:', err);
  }

  if (!existingAccount) {
    // Check local cache
    const local = getCachedAccounts().find((a) => a.email.toLowerCase() === email);
    if (local) existingAccount = local;
  }

  // Handle explicit register mode when account already exists
  if (mode === 'register' && existingAccount) {
    if (existingAccount.password === password) {
      // Password matches, log them in smoothly
      return handleExistingAccountLogin(existingAccount, accountRef, docId, email, device, now, false);
    } else {
      await recordLoginEvent(email, 'register', false);
      throw new Error(
        `This email (${email}) is already registered! Please sign in with your password, or change it in the SYStops Dashboard.`
      );
    }
  }

  // Handle explicit login mode when account doesn't exist
  if (mode === 'login' && !existingAccount) {
    // Check if user meant to register or auto-create
    // We can auto-create or prompt
    // Auto-create to never leave user stranded
  }

  // 2. Existing Account Login
  if (existingAccount) {
    if (existingAccount.password !== password) {
      await recordLoginEvent(email, 'login', false);
      throw new Error(
        'Incorrect password. If forgotten, reset it or use SYStops Dashboard to inspect or change credentials.'
      );
    }
    return handleExistingAccountLogin(existingAccount, accountRef, docId, email, device, now, false);
  }

  // 3. New Account Registration
  const displayName = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'Player';
  const newAccount: AccountRecord = {
    id: docId,
    email,
    password,
    displayName,
    role: 'user',
    lastLoginAt: now,
    lastDevice: device,
    createdAt: now,
    updatedAt: now,
  };

  // Try writing to Cloud Firestore
  try {
    await setDoc(accountRef, newAccount);
  } catch (err) {
    console.warn('Could not save account to Firestore, saving to local cache:', err);
  }

  // Update local cache
  const list = getCachedAccounts().filter((a) => a.id !== docId);
  list.unshift(newAccount);
  cacheAccounts(list);

  // Establish local cross-device active session

  // Establish local session
  const session: GuestSession = {
    uid: docId,
    displayName,
    email,
    isAnonymous: false,
    photoURL: null,
    createdAt: now,
  };
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  notifyAuthListenersExport(auth.currentUser || session);
  await recordLoginEvent(email, 'register', true);

  return {
    success: true,
    message: `Account created for ${email}! Logged in successfully across all devices.`,
    isNewUser: true,
    account: newAccount,
  };
}

async function handleExistingAccountLogin(
  existingAccount: AccountRecord,
  accountRef: any,
  docId: string,
  email: string,
  device: string,
  now: string,
  isNewUser: boolean
): Promise<{ success: boolean; message: string; isNewUser: boolean; account: AccountRecord }> {
  const updatedAccount: AccountRecord = {
    ...existingAccount,
    lastLoginAt: now,
    lastDevice: device,
    updatedAt: now,
  };

  try {
    await updateDoc(accountRef, {
      lastLoginAt: now,
      lastDevice: device,
      updatedAt: now,
    });
  } catch (err) {
    try {
      await setDoc(accountRef, updatedAccount, { merge: true });
    } catch {}
  }

  // Update local cache
  const list = getCachedAccounts().filter((a) => a.id !== docId);
  list.unshift(updatedAccount);
  cacheAccounts(list);

  // Establish active cross-device session

  // Establish active session
  const session: GuestSession = {
    uid: docId,
    displayName: existingAccount.displayName || email.split('@')[0],
    email: email,
    isAnonymous: false,
    photoURL: null,
    createdAt: existingAccount.createdAt,
  };
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  notifyAuthListenersExport(auth.currentUser || session);
  await recordLoginEvent(email, 'login', true);

  return {
    success: true,
    message: `Welcome back, ${session.displayName}! Credentials verified across all devices.`,
    isNewUser,
    account: updatedAccount,
  };
}

/**
 * Fetch all registered accounts from Cloud Firestore across all devices
 */
export async function getAllAccountsFromCloud(): Promise<AccountRecord[]> {
  const results: AccountRecord[] = [];
  try {
    const snap = await getDocs(collection(db, 'accounts'));
    snap.forEach((d) => {
      results.push(d.data() as AccountRecord);
    });
  } catch (err) {
    console.warn('Could not load accounts from Firestore:', err);
  }

  if (results.length === 0) {
    return getCachedAccounts();
  }

  cacheAccounts(results);
  return results;
}

/**
 * Real-time subscription to all registered accounts in Cloud Firestore
 */
export function subscribeToCloudAccounts(callback: (accounts: AccountRecord[]) => void): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, 'accounts'),
      (snap) => {
        const results: AccountRecord[] = [];
        snap.forEach((d) => results.push(d.data() as AccountRecord));
        if (results.length > 0) {
          cacheAccounts(results);
          callback(results);
        } else {
          callback(getCachedAccounts());
        }
      },
      (err) => {
        console.warn('Accounts snapshot listener notice:', err);
        callback(getCachedAccounts());
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Could not attach accounts onSnapshot:', err);
    callback(getCachedAccounts());
    return () => {};
  }
}

/**
 * Fetch all login audit records from Cloud Firestore across all devices
 */
export async function getAllLoginsFromCloud(): Promise<LoginAuditRecord[]> {
  const results: LoginAuditRecord[] = [];
  try {
    const q = query(collection(db, 'logins'), orderBy('timestamp', 'desc'), limit(150));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      results.push(d.data() as LoginAuditRecord);
    });
  } catch (err) {
    console.warn('Could not query logins from Firestore:', err);
    try {
      const snap = await getDocs(collection(db, 'logins'));
      snap.forEach((d) => results.push(d.data() as LoginAuditRecord));
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {}
  }

  if (results.length === 0) {
    return getCachedLogins();
  }

  cacheLogins(results);
  return results;
}

/**
 * Real-time subscription to all login audit records in Cloud Firestore
 */
export function subscribeToCloudLogins(callback: (logins: LoginAuditRecord[]) => void): () => void {
  try {
    const q = query(collection(db, 'logins'), orderBy('timestamp', 'desc'), limit(150));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const results: LoginAuditRecord[] = [];
        snap.forEach((d) => results.push(d.data() as LoginAuditRecord));
        if (results.length > 0) {
          cacheLogins(results);
          callback(results);
        } else {
          callback(getCachedLogins());
        }
      },
      (err) => {
        console.warn('Logins snapshot listener notice:', err);
        callback(getCachedLogins());
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Could not attach logins onSnapshot:', err);
    callback(getCachedLogins());
    return () => {};
  }
}

/**
 * SYSTOPS: Change password for any account across all devices
 */
export async function changeAccountPasswordInCloud(
  targetEmail: string,
  newPassword: string
): Promise<boolean> {
  const email = targetEmail.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!newPassword || newPassword.trim().length < 3) {
    throw new Error('Password must be at least 3 characters.');
  }

  const docId = sanitizeDocId(email);
  const now = new Date().toISOString();
  const accountRef = doc(db, 'accounts', docId);
  const cleanPass = newPassword.trim();

  try {
    await updateDoc(accountRef, {
      password: cleanPass,
      updatedAt: now,
    });
  } catch (err) {
    // If doc didn't exist or updateDoc failed, setDoc with merge
    try {
      await setDoc(
        accountRef,
        {
          id: docId,
          email,
          password: cleanPass,
          displayName: email.split('@')[0],
          role: 'user',
          lastLoginAt: now,
          lastDevice: getClientDeviceInfo(),
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (setErr) {
      console.error('Error updating password in cloud:', setErr);
    }
  }

  // Update local cache
  const cached = getCachedAccounts();
  const idx = cached.findIndex((a) => a.email.toLowerCase() === email);
  if (idx >= 0) {
    cached[idx].password = cleanPass;
    cached[idx].updatedAt = now;
  } else {
    cached.unshift({
      id: docId,
      email,
      password: cleanPass,
      displayName: email.split('@')[0],
      role: 'user',
      lastLoginAt: now,
      lastDevice: getClientDeviceInfo(),
      createdAt: now,
      updatedAt: now,
    });
  }
  cacheAccounts(cached);

  await recordLoginEvent(email, 'password_change', true);
  return true;
}

/**
 * SYSTOPS: Bulk change all passwords across all accounts in the database
 */
export async function bulkChangeAllPasswordsInCloud(newPassword: string): Promise<number> {
  const cleanPass = newPassword.trim();
  if (!cleanPass || cleanPass.length < 3) {
    throw new Error('Password must be at least 3 characters.');
  }

  const now = new Date().toISOString();
  const allAccounts = await getAllAccountsFromCloud();
  let count = 0;

  for (const acc of allAccounts) {
    try {
      const accountRef = doc(db, 'accounts', acc.id);
      await updateDoc(accountRef, {
        password: cleanPass,
        updatedAt: now,
      });
      acc.password = cleanPass;
      acc.updatedAt = now;
      count++;
    } catch {
      acc.password = cleanPass;
      acc.updatedAt = now;
      count++;
    }
  }

  cacheAccounts(allAccounts);
  await recordLoginEvent('ALL_ACCOUNTS_BULK', 'bulk_password_reset', true);
  return count;
}

/**
 * Delete account from cloud
 */
export async function deleteAccountFromCloud(targetEmail: string): Promise<boolean> {
  const email = targetEmail.trim().toLowerCase();
  const docId = sanitizeDocId(email);
  try {
    await deleteDoc(doc(db, 'accounts', docId));
  } catch (err) {
    console.warn('Cloud delete error:', err);
  }

  const cached = getCachedAccounts().filter((a) => a.email.toLowerCase() !== email);
  cacheAccounts(cached);
  return true;
}
