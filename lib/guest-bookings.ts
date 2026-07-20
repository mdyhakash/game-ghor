// Client-side only. Lets guests (no member login) see their own booking
// history without an account — we remember booking IDs they created on
// this device, for at least 2 days, then quietly forget them.
const STORAGE_KEY = "levelup_guest_bookings";
const MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

type StoredEntry = { id: string; savedAt: number };

function readAll(): StoredEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: StoredEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addGuestBooking(id: string) {
  const entries = readAll();
  if (entries.some((e) => e.id === id)) return;
  entries.push({ id, savedAt: Date.now() });
  writeAll(entries);
}

/** Returns booking IDs still within the retention window, and prunes
 * anything older than that from storage as a side effect. */
export function getGuestBookingIds(): string[] {
  const entries = readAll();
  const now = Date.now();
  const fresh = entries.filter((e) => now - e.savedAt < MIN_AGE_MS);
  if (fresh.length !== entries.length) writeAll(fresh);
  return fresh.map((e) => e.id);
}
