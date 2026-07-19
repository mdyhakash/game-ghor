import { ADMIN_PASSWORD } from "@/lib/data";
import { KEYS, read, write } from "./keys";

// -----------------------------------------------------------------------
// Admin — single shared password (see ADMIN_PASSWORD in lib/data.ts),
// session is just a flag in localStorage. Frontend-only demo, not real auth.
// -----------------------------------------------------------------------
export function isAdminLoggedIn(): boolean {
  return read<boolean>(KEYS.adminSession, false);
}

export function adminLogin(password: string): { error: string } | { ok: true } {
  if (password !== ADMIN_PASSWORD) return { error: "Wrong admin password" };
  write(KEYS.adminSession, true);
  return { ok: true };
}

export function adminLogout() {
  write(KEYS.adminSession, false);
}
