export const KEYS = {
  members: "levelup_members",
  bookings: "levelup_bookings",
  session: "levelup_session", // current logged-in member id
  deviceOverrides: "levelup_device_overrides", // deviceId -> DeviceStatus, set by admin
  adminSession: "levelup_admin_session", // "1" when the admin is logged in
  tournaments: "levelup_tournaments",
  participants: "levelup_participants",
  matches: "levelup_matches",
};

export function isBrowser() {
  return typeof window !== "undefined";
}

export function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
