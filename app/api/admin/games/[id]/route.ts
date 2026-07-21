import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { ALL_DEVICE_TYPES, type DeviceType } from "@/lib/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name)
      return NextResponse.json({ error: "Enter a game name" }, { status: 400 });
    data.name = name;
  }
  if (body?.genre !== undefined) {
    const genre = String(body.genre).trim();
    if (!genre)
      return NextResponse.json({ error: "Enter a genre" }, { status: 400 });
    data.genre = genre;
  }
  if (body?.imageUrl !== undefined) {
    const imageUrl = String(body.imageUrl).trim();
    if (!imageUrl)
      return NextResponse.json(
        { error: "Paste the Cloudinary image link" },
        { status: 400 },
      );
    data.imageUrl = imageUrl;
  }
  if (body?.isAvailable !== undefined) {
    data.isAvailable = Boolean(body.isAvailable);
  }
  if (body?.deviceTypes !== undefined) {
    const deviceTypes = body.deviceTypes as DeviceType[];
    if (
      !Array.isArray(deviceTypes) ||
      deviceTypes.length === 0 ||
      !deviceTypes.every((t) => ALL_DEVICE_TYPES.includes(t))
    ) {
      return NextResponse.json(
        { error: "Pick at least one valid device type" },
        { status: 400 },
      );
    }
    data.deviceTypes = deviceTypes;
  }

  const game = await prisma.game.update({ where: { id }, data });
  return NextResponse.json({ game });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.game.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
