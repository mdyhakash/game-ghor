import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json(
      { tournament: null, participants: [], rounds: [] },
      { status: 404 },
    );
  }

  const participants = await prisma.participant.findMany({
    where: { tournamentId: id },
  });
  const nameOf = (pid: string | null) =>
    pid ? (participants.find((p) => p.id === pid)?.name ?? "Unknown") : null;

  const matches = (
    await prisma.match.findMany({
      where: { tournamentId: id },
      orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
    })
  ).map((m) => ({
    ...m,
    participantAName: nameOf(m.participantAId),
    participantBName: nameOf(m.participantBId),
    winnerName: nameOf(m.winnerId),
  }));

  const roundsCount =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const rounds = Array.from({ length: roundsCount }, (_, i) => ({
    round: i + 1,
    matches: matches.filter((m) => m.round === i + 1),
  }));

  return NextResponse.json({ tournament, participants, rounds });
}
