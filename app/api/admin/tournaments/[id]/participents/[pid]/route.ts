import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: tournamentId, pid } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (tournament && tournament.status !== "UPCOMING") {
    return NextResponse.json(
      { error: "Fixture already generated — can't remove players now" },
      { status: 409 },
    );
  }

  await prisma.participant.delete({ where: { id: pid } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
