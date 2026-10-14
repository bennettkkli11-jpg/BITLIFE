/**
 * God Mode & Master Admin Password Authentication
 * 
 * Authorized Passwords:
 * - Grayson Inouye
 * - Grayson Inoue
 * - Raiders
 * - Iolani (including 'Iolani, ʻIolani)
 */

const STORAGE_KEY = 'bitlife_godmode_authenticated';

/**
 * Normalizes input string for forgiving validation
 */
export function normalizePassphrase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[ʻ'’`"]/g, '') // strip okina and apostrophes (e.g. 'Iolani -> iolani)
    .replace(/\s+/g, ' ');
}

export const VALID_GOD_MODE_KEYS = [
  'grayson inouye',
  'grayson inoue',
  'raiders',
  'iolani',
];

/**
 * Validates whether the user provided a correct God Mode password
 */
export function verifyGodModePassword(candidate: string): boolean {
  if (!candidate) return false;
  const clean = normalizePassphrase(candidate);
  return VALID_GOD_MODE_KEYS.includes(clean);
}

/**
 * Checks if current session is already authenticated for God Mode
 */
export function isGodModeUnlocked(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets session authorization status
 */
export function setGodModeUnlocked(unlocked: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (unlocked) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore sessionStorage errors
  }
}
