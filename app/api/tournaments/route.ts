import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    include: { _count: { select: { participants: true } } },
  });

  const result = tournaments.map(({ _count, ...t }) => ({
    ...t,
    participantCount: _count.participants,
  }));

  return NextResponse.json(result);
}
