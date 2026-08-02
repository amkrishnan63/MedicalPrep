import { NextResponse } from "next/server";
import { z } from "zod";
import { canEdit, getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshProfileAlerts } from "@/lib/interactions";
import { audit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const allergies = await prisma.allergy.findMany({ where: { profileId } });
  return NextResponse.json({ allergies });
}

const schema = z.object({
  substance: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "CAREGIVER");
  if (!role || !canEdit(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const allergy = await prisma.allergy.create({
    data: {
      profileId,
      substance: parsed.data.substance,
      reaction: parsed.data.reaction,
      severity: parsed.data.severity ?? "moderate",
    },
  });
  const alerts = await refreshProfileAlerts(profileId);
  await audit({
    actorId: user.id,
    profileId,
    action: "allergy.create",
    entityRef: allergy.id,
  });
  return NextResponse.json({ allergy, alerts });
}
