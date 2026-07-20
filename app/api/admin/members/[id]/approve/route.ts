import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const member = await prisma.member.update({
    where: { id },
    data: { membershipStatus: "APPROVED" },
  });

  return NextResponse.json({ member });
}
