import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import type { DeviceType } from "@/lib/data";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const type = body?.type as DeviceType;
  const pricePerHour = Number(body?.pricePerHour);

  if (!name) {
    return NextResponse.json({ error: "Enter a device name" }, { status: 400 });
  }
  if (!["PC", "PS4", "PS5"].includes(type)) {
    return NextResponse.json({ error: "Invalid device type" }, { status: 400 });
  }
  if (!pricePerHour || pricePerHour <= 0) {
    return NextResponse.json(
      { error: "Enter a valid price per hour" },
      { status: 400 },
    );
  }

  const device = await prisma.device.create({
    data: { name, type, pricePerHour, status: "AVAILABLE" },
  });

  return NextResponse.json({ device });
}
