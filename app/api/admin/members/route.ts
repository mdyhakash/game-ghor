import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  const result = members.map((m) => ({
    id: m.id,
    memberNo: m.memberNo,
    name: m.name,
    phone: m.phone,
    points: m.points,
    membershipStatus: m.membershipStatus,
    createdAt: m.createdAt,
    visitCount: m._count.bookings,
  }));

  return NextResponse.json(result);
}
