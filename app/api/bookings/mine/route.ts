import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMemberSession } from "@/lib/session";

export async function GET() {
  const memberId = await getMemberSession();
  if (!memberId)
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { memberId },
    include: { device: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
