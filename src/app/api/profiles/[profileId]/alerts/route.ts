import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshProfileAlerts } from "@/lib/interactions";
import { audit } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const refresh = new URL(req.url).searchParams.get("refresh") === "1";
  const alerts = refresh
    ? await refreshProfileAlerts(profileId)
    : await prisma.interactionAlert.findMany({
        where: { profileId, status: { in: ["open", "acknowledged"] } },
        orderBy: [{ createdAt: "desc" }],
      });

  const order = { Serious: 0, Caution: 1, Informational: 2 } as Record<string, number>;
  alerts.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

  return NextResponse.json({ alerts });
}

const patchSchema = z.object({
  alertId: z.string(),
  action: z.enum(["acknowledge", "dismiss"]),
  reason: z.string().optional(),
  discussedWithClinician: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "CAREGIVER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const alert = await prisma.interactionAlert.findFirst({
    where: { id: parsed.data.alertId, profileId },
  });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "dismiss" && alert.severity === "Serious") {
    return NextResponse.json(
      { error: "Serious alerts require acknowledgment, not dismiss" },
      { status: 400 },
    );
  }

  const updated = await prisma.interactionAlert.update({
    where: { id: alert.id },
    data: {
      status: parsed.data.action === "acknowledge" ? "acknowledged" : "dismissed",
      ackedAt: new Date(),
      dismissReason:
        parsed.data.reason ??
        (parsed.data.discussedWithClinician ? "discussed_with_clinician" : undefined),
    },
  });

  await audit({
    actorId: user.id,
    profileId,
    action: `alert.${parsed.data.action}`,
    entityRef: alert.id,
  });

  return NextResponse.json({ alert: updated });
}
