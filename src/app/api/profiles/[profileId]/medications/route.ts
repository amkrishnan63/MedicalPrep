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
  const medications = await prisma.medication.findMany({
    where: { profileId },
    orderBy: [{ status: "asc" }, { displayName: "asc" }],
  });
  return NextResponse.json({ medications, role });
}

const medSchema = z.object({
  displayName: z.string().min(1),
  genericName: z.string().optional().nullable(),
  rxnorm: z.string().optional().nullable(),
  drugKey: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  form: z.string().optional().nullable(),
  dose: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  scheduleTimes: z.array(z.string()).optional(),
  prn: z.boolean().optional(),
  indication: z.string().optional().nullable(),
  prescriber: z.string().optional().nullable(),
  pharmacy: z.string().optional().nullable(),
  status: z.enum(["active", "stopped", "inactive"]).optional(),
  source: z.string().optional(),
  needsReview: z.boolean().optional(),
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
  const parsed = medSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const medication = await prisma.medication.create({
    data: {
      profileId,
      displayName: parsed.data.displayName,
      genericName: parsed.data.genericName ?? undefined,
      rxnorm: parsed.data.rxnorm ?? undefined,
      drugKey: parsed.data.drugKey ?? undefined,
      strength: parsed.data.strength ?? undefined,
      form: parsed.data.form ?? undefined,
      dose: parsed.data.dose ?? undefined,
      route: parsed.data.route ?? "oral",
      frequency: parsed.data.frequency ?? undefined,
      scheduleTimes: JSON.stringify(parsed.data.scheduleTimes ?? []),
      prn: parsed.data.prn ?? false,
      indication: parsed.data.indication ?? undefined,
      prescriber: parsed.data.prescriber ?? undefined,
      pharmacy: parsed.data.pharmacy ?? undefined,
      status: parsed.data.status ?? "active",
      source: parsed.data.source ?? "manual",
      needsReview: parsed.data.needsReview ?? !parsed.data.drugKey,
      startAt: new Date(),
    },
  });

  const alerts = await refreshProfileAlerts(profileId);
  await audit({
    actorId: user.id,
    profileId,
    action: "medication.create",
    entityRef: medication.id,
    payload: { displayName: medication.displayName },
  });

  return NextResponse.json({ medication, alerts });
}
