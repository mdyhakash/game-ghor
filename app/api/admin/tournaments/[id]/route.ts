import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const existing = await prisma.tournament.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 },
    );
  }

  const data: Record<string, unknown> = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name)
      return NextResponse.json(
        { error: "Enter a tournament name" },
        { status: 400 },
      );
    data.name = name;
  }
  if (body?.gameTitle !== undefined) {
    data.gameTitle = String(body.gameTitle).trim() || "Custom";
  }
  if (body?.entryFee !== undefined) {
    data.entryFee = Number(body.entryFee) || 0;
  }
  if (body?.prizePool !== undefined) {
    data.prizePool = String(body.prizePool).trim();
  }
  if (body?.startDate !== undefined) {
    if (!body.startDate)
      return NextResponse.json({ error: "Pick a start date" }, { status: 400 });
    data.startDate = new Date(body.startDate);
  }
  if (body?.description !== undefined) {
    data.description = String(body.description).trim();
  }
  if (body?.maxPlayers !== undefined) {
    const maxPlayers = Number(body.maxPlayers);
    if (![4, 8, 16, 32].includes(maxPlayers)) {
      return NextResponse.json(
        { error: "Max players must be 4, 8, 16, or 32" },
        { status: 400 },
      );
    }
    if (existing.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "Can't change max players after the fixture is generated" },
        { status: 409 },
      );
    }
    const participantCount = await prisma.participant.count({
      where: { tournamentId: id },
    });
    if (maxPlayers < participantCount) {
      return NextResponse.json(
        {
          error: `Already has ${participantCount} players — pick a max of at least that many`,
        },
        { status: 409 },
      );
    }
    data.maxPlayers = maxPlayers;
  }

  const tournament = await prisma.tournament.update({ where: { id }, data });
  return NextResponse.json({ tournament });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  // participants and matches cascade-delete automatically (schema already
  // sets onDelete: Cascade on both relations to Tournament)
  await prisma.tournament.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
