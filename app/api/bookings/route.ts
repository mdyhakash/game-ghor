import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMemberSession } from "@/lib/session";
import {
  calculatePrice,
  generateTokenCandidate,
  type DeviceType,
} from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const deviceType = body?.deviceType as DeviceType;
  const startTime = body?.startTime as string;
  const durationHrs = Number(body?.durationHrs);
  const guestPhone = body?.guestPhone as string | undefined;

  if (!deviceType || !startTime || !durationHrs) {
    return NextResponse.json(
      { error: "Missing booking details" },
      { status: 400 },
    );
  }

  const memberId = await getMemberSession();
  const member = memberId
    ? await prisma.member.findUnique({ where: { id: memberId } })
    : null;

  if (!member && !guestPhone) {
    return NextResponse.json(
      { error: "Enter a phone number, or log in as a member." },
      { status: 400 },
    );
  }
  if (!member && guestPhone && !/^01[0-9]{9}$/.test(guestPhone.trim())) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit phone number" },
      { status: 400 },
    );
  }

  const start = new Date(startTime);
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
      { error: "That slot was just taken. Pick another one." },
      { status: 409 },
    );
  }

  const effectiveTier =
    member && member.membershipStatus === "APPROVED" ? member.tier : null;
  const { basePrice, discount, finalPrice, pointsEarned } = calculatePrice(
    device.pricePerHour,
    durationHrs,
    effectiveTier,
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
      memberId: member?.id,
      guestPhone: member ? undefined : guestPhone?.trim(),
      startTime: start,
      endTime: end,
      durationHrs,
      status: "WAITING",
      basePrice,
      discountApplied: discount,
      finalPrice,
      pointsEarned,
      paid: false,
    },
  });

  return NextResponse.json({ booking });
}
