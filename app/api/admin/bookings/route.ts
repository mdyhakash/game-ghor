import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  calculatePrice,
  generateTokenCandidate,
  type DeviceType,
} from "@/lib/data";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const bookings = await prisma.booking.findMany({
    include: { device: true, member: true },
    orderBy: { createdAt: "desc" },
  });

  const result = bookings.map(({ member, ...b }) => ({
    ...b,
    customerLabel: member
      ? member.name
      : b.guestPhone
        ? `Guest · ${b.guestPhone}`
        : "Guest",
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const deviceType = body?.deviceType as DeviceType;
  const durationHrs = Number(body?.durationHrs);
  const guestPhone = (body?.guestPhone as string | undefined)?.trim();

  if (!deviceType || !durationHrs) {
    return NextResponse.json(
      { error: "Missing booking details" },
      { status: 400 },
    );
  }
  if (guestPhone && !/^01[0-9]{9}$/.test(guestPhone)) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit phone number, or leave it blank" },
      { status: 400 },
    );
  }

  const start = new Date();
  const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);

  const candidates = await prisma.device.findMany({
    where: { type: deviceType, status: "AVAILABLE" },
  });
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No devices of this type available" },
      { status: 409 },
    );
  }

  const overlapping = await prisma.booking.findMany({
    where: {
      deviceId: { in: candidates.map((c) => c.id) },
      status: { in: ["WAITING", "ACTIVE"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  const busyIds = new Set(overlapping.map((b) => b.deviceId));
  const device = candidates.find((d) => !busyIds.has(d.id));

  if (!device) {
    return NextResponse.json(
      { error: "No free device of this type right now" },
      { status: 409 },
    );
  }

  const { basePrice, discount, finalPrice, pointsEarned } = calculatePrice(
    device.pricePerHour,
    durationHrs,
    null,
  );

  let token = generateTokenCandidate();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.booking.findUnique({ where: { token } });
    if (!clash) break;
    token = generateTokenCandidate();
  }

  const booking = await prisma.booking.create({
    data: {
      token,
      deviceId: device.id,
      guestPhone: guestPhone || undefined,
      startTime: start,
      endTime: end,
      durationHrs,
      status: "ACTIVE",
      basePrice,
      discountApplied: discount,
      finalPrice,
      pointsEarned,
      paid: false,
    },
  });

  return NextResponse.json({ booking });
}
