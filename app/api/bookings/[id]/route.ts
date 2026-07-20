import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { device: true, member: true },
  });

  if (!booking) {
    return NextResponse.json(
      { booking: null, device: null, member: null },
      { status: 404 },
    );
  }

  const { device, member, ...bookingFields } = booking;
  return NextResponse.json({ booking: bookingFields, device, member });
}
