import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { ALL_DEVICE_TYPES, type DeviceType } from "@/lib/data";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const genre = (body?.genre ?? "").trim();
  const imageUrl = (body?.imageUrl ?? "").trim();
  const isAvailable = body?.isAvailable !== false;
  const deviceTypes = Array.isArray(body?.deviceTypes)
    ? (body.deviceTypes as DeviceType[])
    : [];

  if (!name)
    return NextResponse.json({ error: "Enter a game name" }, { status: 400 });
  if (!genre)
    return NextResponse.json({ error: "Enter a genre" }, { status: 400 });
  if (!imageUrl)
    return NextResponse.json(
      { error: "Paste the Cloudinary image link" },
      { status: 400 },
    );
  if (
    deviceTypes.length === 0 ||
    !deviceTypes.every((t) => ALL_DEVICE_TYPES.includes(t))
  ) {
    return NextResponse.json(
      { error: "Pick at least one valid device type" },
      { status: 400 },
    );
  }

  const game = await prisma.game.create({
    data: { name, genre, imageUrl, isAvailable, deviceTypes },
  });

  return NextResponse.json({ game });
}
