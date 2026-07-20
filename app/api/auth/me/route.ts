import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMemberSession } from "@/lib/session";
import { TIER_INFO } from "@/lib/data";

export async function GET() {
  const memberId = await getMemberSession();
  if (!memberId) return NextResponse.json({ member: null });

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return NextResponse.json({ member: null });

  return NextResponse.json({
    member: {
      id: member.id,
      name: member.name,
      tier: member.tier,
      membershipStatus: member.membershipStatus,
      points: member.points,
      totalHours: member.totalHours,
      tierInfo: TIER_INFO[member.tier],
    },
  });
}
