import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { memberId: id },
    include: { device: true },
    orderBy: { createdAt: "desc" },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const visitsLast30Days = bookings.filter(
    (b) => b.createdAt >= thirtyDaysAgo,
  ).length;

  return NextResponse.json({
    member,
    bookings,
    visitCount: bookings.length,
    lastVisit: bookings[0]?.createdAt ?? null,
    visitsLast30Days,
  });
}
