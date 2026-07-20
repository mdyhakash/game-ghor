import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import type { DeviceStatus } from "@/lib/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as DeviceStatus;

  if (!status || !["AVAILABLE", "MAINTENANCE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const device = await prisma.device.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ device });
}
