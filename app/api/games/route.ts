import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const games = await prisma.game.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(games);
}
