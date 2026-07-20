import prisma from "@/lib/prisma";

const GRACE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Auto-cancels any WAITING booking whose slot started more than 10 minutes
 * ago and was never activated (no-show). Safe to call on every request —
 * it's a single cheap updateMany, not a scan.
 */
export async function expireStaleWaitingBookings() {
  const cutoff = new Date(Date.now() - GRACE_MS);
  await prisma.booking.updateMany({
    where: {
      status: "WAITING",
      startTime: { lte: cutoff },
    },
    data: { status: "CANCELLED" },
  });
}
