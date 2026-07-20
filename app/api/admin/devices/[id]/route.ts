import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import type { DeviceType } from "@/lib/data";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json(
        { error: "Enter a device name" },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (body?.type !== undefined) {
    const type = body.type as DeviceType;
    if (
      !["PC", "PS3", "PS4", "PS5", "Mobile", "Racing", "Arcade", "VR"].includes(
        type,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid device type" },
        { status: 400 },
      );
    }
    data.type = type;
  }

  if (body?.pricePerHour !== undefined) {
    const pricePerHour = Number(body.pricePerHour);
    if (!pricePerHour || pricePerHour <= 0) {
      return NextResponse.json(
        { error: "Enter a valid price per hour" },
        { status: 400 },
      );
    }
    data.pricePerHour = pricePerHour;
  }

  const device = await prisma.device.update({ where: { id }, data });
  return NextResponse.json({ device });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const bookingCount = await prisma.booking.count({ where: { deviceId: id } });
  if (bookingCount > 0) {
    return NextResponse.json(
      {
        error:
          "Can't delete a device with booking history. Set it to Maintenance instead if it's retired.",
      },
      { status: 409 },
    );
  }

  await prisma.device.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
