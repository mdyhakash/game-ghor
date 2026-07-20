import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const now = new Date();
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const [devices, activeBookings, todaysBookings, totalMembers] =
    await Promise.all([
      prisma.device.findMany(),
      prisma.booking.findMany({
        where: {
          status: { in: ["WAITING", "ACTIVE"] },
          startTime: { lte: now },
          endTime: { gte: now },
        },
        select: { deviceId: true },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: baseDate } },
        select: { finalPrice: true },
      }),
      prisma.member.count(),
    ]);

  const busyDeviceIds = new Set(activeBookings.map((b) => b.deviceId));
  const devicesFree = devices.filter(
    (d) => d.status === "AVAILABLE" && !busyDeviceIds.has(d.id),
  ).length;

  return NextResponse.json({
    devicesFree,
    devicesTotal: devices.length,
    bookingsToday: todaysBookings.length,
    revenueToday: todaysBookings.reduce((sum, b) => sum + b.finalPrice, 0),
    totalMembers,
  });
}
