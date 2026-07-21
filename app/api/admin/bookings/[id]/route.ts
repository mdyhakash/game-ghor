import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.paid) {
    return NextResponse.json(
      {
        error:
          "Can't delete a paid booking — cancel it first if it was a mistake, that reverses the credit.",
      },
      { status: 409 },
    );
  }

  await prisma.booking.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
