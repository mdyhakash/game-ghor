import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  OPEN_HOUR,
  CLOSE_HOUR,
  type DeviceType,
  DEVICE_META,
} from "@/lib/data";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as DeviceType | null;
  if (!type || !(type in DEVICE_META)) {
    return NextResponse.json({ error: "Invalid device type" }, { status: 400 });
  }

  const devices = await prisma.device.findMany({
    where: { type, status: "AVAILABLE" },
  });
  if (devices.length === 0) {
    return NextResponse.json({ pricePerHour: 0, deviceCount: 0, slots: [] });
  }

  const pricePerHour = devices[0].pricePerHour;
  const deviceIds = devices.map((d) => d.id);

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23, 59, 59, 999);

  const todaysBookings = await prisma.booking.findMany({
    where: {
      deviceId: { in: deviceIds },
      status: { in: ["WAITING", "ACTIVE"] },
      startTime: { gte: baseDate, lte: dayEnd },
    },
  });

  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const slotStart = new Date(baseDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    const isPast = slotStart.getTime() < Date.now();

    const busyDeviceIds = new Set(
      todaysBookings
        .filter((b) => slotStart < b.endTime && slotEnd > b.startTime)
        .map((b) => b.deviceId),
    );
    const freeDevices = devices.length - busyDeviceIds.size;

    slots.push({
      startTime: slotStart.toISOString(),
      label: slotStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      available: freeDevices > 0 && !isPast,
    });
  }

  return NextResponse.json({
    pricePerHour,
    deviceCount: devices.length,
    slots,
  });
}
