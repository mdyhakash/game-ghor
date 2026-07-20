import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { nextPowerOfTwo } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: tournamentId, matchId } = await params;
  const body = await req.json().catch(() => null);
  const winnerId = body?.winnerId as string;
  const scoreA = body?.scoreA != null ? Number(body.scoreA) : undefined;
  const scoreB = body?.scoreB != null ? Number(body.scoreB) : undefined;

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
  });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (!match.participantAId || !match.participantBId) {
    return NextResponse.json(
      { error: "Both players aren't set yet" },
      { status: 400 },
    );
  }
  if (winnerId !== match.participantAId && winnerId !== match.participantBId) {
    return NextResponse.json(
      { error: "Winner must be one of the two players" },
      { status: 400 },
    );
  }

  const participantCount = await prisma.participant.count({
    where: { tournamentId },
  });
  const bracketSize =
    participantCount > 0 ? nextPowerOfTwo(participantCount) : 0;
  const totalRounds = bracketSize > 1 ? Math.log2(bracketSize) : 0;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      winnerId,
      status: "COMPLETED",
      scoreA: scoreA ?? null,
      scoreB: scoreB ?? null,
    },
  });

  if (match.round < totalRounds) {
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.matchIndex / 2);
    const field: "participantAId" | "participantBId" =
      match.matchIndex % 2 === 0 ? "participantAId" : "participantBId";
    await prisma.match.updateMany({
      where: { tournamentId, round: nextRound, matchIndex: nextIndex },
      data: { [field]: winnerId },
    });
  }

  if (match.round === totalRounds) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({ ok: true });
}
