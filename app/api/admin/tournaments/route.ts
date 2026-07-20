import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const gameTitle = (body?.gameTitle ?? "").trim() || "Custom";
  const maxPlayers = Number(body?.maxPlayers);
  const entryFee = Number(body?.entryFee) || 0;
  const prizePool = (body?.prizePool ?? "").trim();
  const startDate = body?.startDate as string;
  const description = (body?.description ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Enter a tournament name" },
      { status: 400 },
    );
  }
  if (![4, 8, 16, 32].includes(maxPlayers)) {
    return NextResponse.json(
      { error: "Max players must be 4, 8, 16, or 32" },
      { status: 400 },
    );
  }
  if (!startDate) {
    return NextResponse.json({ error: "Pick a start date" }, { status: 400 });
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      gameTitle,
      maxPlayers,
      entryFee,
      prizePool,
      startDate: new Date(startDate),
      description,
      status: "UPCOMING",
    },
  });

  return NextResponse.json({ tournament });
}
