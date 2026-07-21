import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Admin login required" },
      { status: 401 },
    );
  }
  return null;
}
