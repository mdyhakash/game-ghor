import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret";
const MEMBER_COOKIE = "levelup_session";
const ADMIN_COOKIE = "levelup_admin_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(value: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

// ---- Member session ----
export async function setMemberSession(memberId: string) {
  const store = await cookies();
  store.set(MEMBER_COOKIE, sign(memberId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getMemberSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(MEMBER_COOKIE)?.value;
  if (!raw) return null;
  return unsign(raw);
}

export async function clearMemberSession() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

// ---- Admin session ----
export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  return unsign(raw) === "admin";
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
