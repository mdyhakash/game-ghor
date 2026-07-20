import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setMemberSession } from "@/lib/session";
import { TIER_INFO } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const phone = (body?.phone ?? "").trim();
  const password = body?.password ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  }
  if (!/^01[0-9]{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit phone number" },
      { status: 400 },
    );
  }
  if (password.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters" },
      { status: 400 },
    );
  }

  const existing = await prisma.member.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      {
        error: "This phone number is already a member. Try logging in instead.",
      },
      { status: 409 },
    );
  }

  const member = await prisma.member.create({
    data: { name, phone, password: hashPassword(password) },
  });

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
