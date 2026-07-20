import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password ?? "";

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: ADMIN_PASSWORD is not set" },
      { status: 500 },
    );
  }
  if (password !== expected) {
    return NextResponse.json(
      { error: "Wrong admin password" },
      { status: 401 },
    );
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
