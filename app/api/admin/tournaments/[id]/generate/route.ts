import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { nextPowerOfTwo, shuffle } from "@/lib/data";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 },
    );
  }

  const participants = await prisma.participant.findMany({
    where: { tournamentId },
  });
  if (participants.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 participants to generate a fixture" },
      { status: 400 },
    );
  }

  const bracketSize = nextPowerOfTwo(participants.length);
  const totalRounds = Math.log2(bracketSize);

  const shuffledIds = shuffle(participants.map((p) => p.id));
  const slots: (string | null)[] = [
    ...shuffledIds,
    ...Array(bracketSize - shuffledIds.length).fill(null),
  ];
  const shuffledSlots = shuffle(slots);

  type NewMatch = Prisma.MatchCreateManyInput;
  const newMatches: NewMatch[] = [];

  for (let i = 0; i < bracketSize / 2; i++) {
    const a = shuffledSlots[i * 2];
    const b = shuffledSlots[i * 2 + 1];
    const isBye = !a || !b;
    newMatches.push({
      tournamentId,
      round: 1,
      matchIndex: i,
      participantAId: a,
      participantBId: b,
      winnerId: isBye ? (a ?? b) : null,
      scoreA: null,
      scoreB: null,
      status: isBye ? "COMPLETED" : "PENDING",
    });
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      newMatches.push({
        tournamentId,
        round,
        matchIndex: i,
        participantAId: null,
        participantBId: null,
        winnerId: null,
        scoreA: null,
        scoreB: null,
        status: "PENDING",
      });
    }
  }

  if (totalRounds >= 2) {
    for (const m of newMatches.filter((m) => m.round === 1 && m.winnerId)) {
      const next = newMatches.find(
        (n) => n.round === 2 && n.matchIndex === Math.floor(m.matchIndex / 2),
      );
      if (next) {
        if (m.matchIndex % 2 === 0) next.participantAId = m.winnerId;
        else next.participantBId = m.winnerId;
      }
    }
  }

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { tournamentId } }),
    prisma.match.createMany({ data: newMatches }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "ONGOING" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
