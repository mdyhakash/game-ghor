import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const devices = await prisma.device.findMany({ orderBy: { name: "asc" } });
  const now = new Date();

  const activeBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["WAITING", "ACTIVE"] },
      startTime: { lte: now },
      endTime: { gte: now },
    },
    select: { deviceId: true },
  });
  const busyDeviceIds = new Set(activeBookings.map((b) => b.deviceId));

  const result = devices.map((d) => ({
    ...d,
    isFreeNow: d.status === "AVAILABLE" && !busyDeviceIds.has(d.id),
  }));

  return NextResponse.json(result);
}
