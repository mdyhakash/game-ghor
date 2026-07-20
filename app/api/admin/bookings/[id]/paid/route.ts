import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { tierForHours } from "@/lib/data";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.paid) {
    return NextResponse.json({ booking });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const paidBooking = await tx.booking.update({
      where: { id },
      data: { paid: true },
    });

    if (booking.memberId) {
      const member = await tx.member.findUnique({
        where: { id: booking.memberId },
      });
      if (member) {
        const newTotalHours = member.totalHours + booking.durationHrs;
        await tx.member.update({
          where: { id: member.id },
          data: {
            points: member.points + booking.pointsEarned,
            totalHours: newTotalHours,
            tier: tierForHours(newTotalHours),
          },
        });
      }
    }

    return paidBooking;
  });

  return NextResponse.json({ booking: updated });
}
