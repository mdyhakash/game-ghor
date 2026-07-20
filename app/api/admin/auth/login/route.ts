import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/session";
import { ADMIN_PASSWORD } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password ?? "";

  const expected = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;
  if (password !== expected) {
    return NextResponse.json(
      { error: "Wrong admin password" },
      { status: 401 },
    );
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
