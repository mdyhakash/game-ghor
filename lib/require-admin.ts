import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/session";

/** Returns null if the request has a valid admin session, otherwise a
 * ready-to-return 401 NextResponse. Use like:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin() {
  const ok = await isAdminSession();
  if (!ok) {
    return NextResponse.json(
      { error: "Admin login required" },
      { status: 401 },
    );
  }
  return null;
}
