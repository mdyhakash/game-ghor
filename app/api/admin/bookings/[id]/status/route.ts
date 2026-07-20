import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { tierForHours } from "@/lib/data";
import type { BookingStatus } from "@/lib/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as BookingStatus;

  if (
    !status ||
    !["WAITING", "ACTIVE", "COMPLETED", "CANCELLED"].includes(status)
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Cancelling a booking that was already paid: refund it — undo the
  // points/hours credit so the member isn't rewarded for a session that
  // never happened.
  if (status === "CANCELLED" && existing.paid) {
    const booking = await prisma.$transaction(async (tx) => {
      if (existing.memberId) {
        const member = await tx.member.findUnique({
          where: { id: existing.memberId },
        });
        if (member) {
          const revertedHours = Math.max(
            0,
            member.totalHours - existing.durationHrs,
          );
          await tx.member.update({
            where: { id: member.id },
            data: {
              points: Math.max(0, member.points - existing.pointsEarned),
              totalHours: revertedHours,
              tier: tierForHours(revertedHours),
            },
          });
        }
      }
      return tx.booking.update({
        where: { id },
        data: { status, paid: false },
      });
    });
    return NextResponse.json({ booking });
  }

  if (status === "ACTIVE") {
    const start = new Date();
    const end = new Date(
      start.getTime() + existing.durationHrs * 60 * 60 * 1000,
    );
    const booking = await prisma.booking.update({
      where: { id },
      data: { status, startTime: start, endTime: end },
    });
    return NextResponse.json({ booking });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ booking });
}
