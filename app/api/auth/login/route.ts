import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setMemberSession } from "@/lib/session";
import { TIER_INFO } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = (body?.phone ?? "").trim();
  const password = body?.password ?? "";

  if (!phone) {
    return NextResponse.json(
      { error: "Enter your phone number" },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json({ error: "Enter your password" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { phone } });
  if (!member || !verifyPassword(password, member.password)) {
    return NextResponse.json(
      { error: "Wrong phone number or password" },
      { status: 401 },
    );
  }

  await setMemberSession(member.id);

  return NextResponse.json({
    id: member.id,
    name: member.name,
    tier: member.tier,
    membershipStatus: member.membershipStatus,
    points: member.points,
    totalHours: member.totalHours,
    tierInfo: TIER_INFO[member.tier],
  });
}
