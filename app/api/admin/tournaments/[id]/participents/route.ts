import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: tournamentId } = await params;
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const phone = (body?.phone as string | undefined)?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Enter a player/team name" },
      { status: 400 },
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 },
    );
  }
  if (tournament.status !== "UPCOMING") {
    return NextResponse.json(
      { error: "Fixture already generated — can't add players now" },
      { status: 409 },
    );
  }

  const count = await prisma.participant.count({ where: { tournamentId } });
  if (count >= tournament.maxPlayers) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
  }

  const participant = await prisma.participant.create({
    data: { tournamentId, name, phone: phone || undefined },
  });

  return NextResponse.json({ participant });
}
