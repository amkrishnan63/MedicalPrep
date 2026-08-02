import { NextResponse } from "next/server";
import { z } from "zod";
import { canEdit, getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshProfileAlerts } from "@/lib/interactions";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  genericName: z.string().optional().nullable(),
  rxnorm: z.string().optional().nullable(),
  drugKey: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  dose: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  scheduleTimes: z.array(z.string()).optional(),
  prn: z.boolean().optional(),
  indication: z.string().optional().nullable(),
  status: z.enum(["active", "stopped", "inactive"]).optional(),
  needsReview: z.boolean().optional(),
  confirm: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ profileId: string; medId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId, medId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "CAREGIVER");
  if (!role || !canEdit(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.medication.findFirst({ where: { id: medId, profileId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { confirm, scheduleTimes, status, ...rest } = parsed.data;
  const medication = await prisma.medication.update({
    where: { id: medId },
    data: {
      ...rest,
      scheduleTimes: scheduleTimes ? JSON.stringify(scheduleTimes) : undefined,
      status,
      stopAt: status === "stopped" ? new Date() : undefined,
      lastConfirmedAt: confirm ? new Date() : undefined,
    },
  });

  const alerts = await refreshProfileAlerts(profileId);
  await audit({
    actorId: user.id,
    profileId,
    action: "medication.update",
    entityRef: medId,
    payload: parsed.data,
  });

  return NextResponse.json({ medication, alerts });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ profileId: string; medId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId, medId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "CAREGIVER");
  if (!role || !canEdit(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const existing = await prisma.medication.findFirst({ where: { id: medId, profileId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const medication = await prisma.medication.update({
    where: { id: medId },
    data: { status: "stopped", stopAt: new Date() },
  });
  const alerts = await refreshProfileAlerts(profileId);
  await audit({
    actorId: user.id,
    profileId,
    action: "medication.stop",
    entityRef: medId,
  });
  return NextResponse.json({ medication, alerts });
}
