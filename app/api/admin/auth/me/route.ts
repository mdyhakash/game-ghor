import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    isAdmin: !!session?.user,
    email: session?.user?.email ?? null,
    name: session?.user?.name ?? null,
  });
}
