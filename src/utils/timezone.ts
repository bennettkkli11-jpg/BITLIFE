import { TIMEZONES, TimeZoneOption } from '../data/timezones';

export const TIMEZONE_STORAGE_KEY = 'bitlife_user_timezone_v1';

/**
 * Detect the browser's default timezone, falling back to America/New_York
 */
export function getBrowserDefaultTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      // Check if it exists or matches one of our zones
      return detected;
    }
  } catch {}
  return 'America/New_York';
}

/**
 * Returns the currently active timezone ID from localStorage, or detected default
 */
export function getSelectedTimezone(): string {
  try {
    const saved = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (saved) {
      // Validate it can be parsed by Intl
      new Intl.DateTimeFormat('en-US', { timeZone: saved });
      return saved;
    }
  } catch {}
  return getBrowserDefaultTimezone();
}

/**
 * Save selected timezone and dispatch event so all components react immediately
 */
export function setSelectedTimezone(tzId: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tzId });
    localStorage.setItem(TIMEZONE_STORAGE_KEY, tzId);
    window.dispatchEvent(new CustomEvent('bitlife_timezone_changed', { detail: { timezone: tzId } }));
  } catch (err) {
    console.error('Invalid timezone requested:', tzId, err);
  }
}

/**
 * Find the metadata object for a timezone
 */
export function getTimezoneMeta(tzId: string): TimeZoneOption {
  const found = TIMEZONES.find((t) => t.id === tzId);
  if (found) return found;

  // Fallback metadata for any other IANA string
  return {
    id: tzId,
    name: tzId.replace(/_/g, ' '),
    shortName: tzId.split('/').pop()?.replace(/_/g, ' ') || tzId,
    category: 'OBSCURE',
    flag: '🌐',
    location: tzId,
  };
}

/**
 * Format live time in a given timezone, e.g. "11:48:15 PM" or "11:48 PM"
 */
export function formatTimeInZone(
  date: Date = new Date(),
  tzId: string = getSelectedTimezone(),
  includeSeconds: boolean = false
): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      hour: 'numeric',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

/**
 * Format timezone abbreviation / short code, e.g. "EDT", "PST", "CHAST"
 */
export function getTimezoneAbbreviation(
  date: Date = new Date(),
  tzId: string = getSelectedTimezone()
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'short',
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

/**
 * Format full date string in timezone, e.g. "Sat, Oct 10, 2026"
 */
export function formatDateInZone(
  date: Date = new Date(),
  tzId: string = getSelectedTimezone()
): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Format ISO-like YYYY-MM-DD in the selected timezone
 * Critical for Daily Streak calculation so streak resets at midnight in chosen timezone!
 */
export function getDateKeyInZone(
  date: Date = new Date(),
  tzId: string = getSelectedTimezone()
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';

    return `${year}-${month}-${day}`;
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns UTC offset string like "UTC-4:00" or "UTC+12:45"
 */
export function getUtcOffsetString(
  date: Date = new Date(),
  tzId: string = getSelectedTimezone()
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (offsetPart && offsetPart.value) {
      return offsetPart.value.replace('GMT', 'UTC');
    }
  } catch {}
  return '';
}
