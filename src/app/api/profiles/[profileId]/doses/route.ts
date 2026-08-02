import { NextResponse } from "next/server";
import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { canEdit, getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTimes } from "@/lib/format";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dateStr = new URL(req.url).searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const meds = await prisma.medication.findMany({
    where: { profileId, status: "active", prn: false },
  });

  const dayStart = parse(`${dateStr} 00:00`, "yyyy-MM-dd HH:mm", new Date());
  const dayEnd = parse(`${dateStr} 23:59`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(dayStart)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const existing = await prisma.doseEvent.findMany({
    where: {
      profileId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    include: { medication: true },
  });

  const schedule: {
    medicationId: string;
    medicationName: string;
    scheduledAt: string;
    status: string;
    doseEventId?: string;
  }[] = [];

  for (const med of meds) {
    const times = parseTimes(med.scheduleTimes);
    for (const t of times) {
      const scheduledAt = parse(`${dateStr} ${t}`, "yyyy-MM-dd HH:mm", new Date());
      if (!isValid(scheduledAt)) continue;
      const event = existing.find(
        (e) =>
          e.medicationId === med.id &&
          format(e.scheduledAt, "HH:mm") === t,
      );
      schedule.push({
        medicationId: med.id,
        medicationName: med.displayName,
        scheduledAt: scheduledAt.toISOString(),
        status: event?.status ?? "pending",
        doseEventId: event?.id,
      });
    }
  }

  schedule.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return NextResponse.json({ date: dateStr, schedule });
}

const schema = z.object({
  medicationId: z.string(),
  scheduledAt: z.string(),
  status: z.enum(["taken", "skipped", "late", "snoozed"]),
  note: z.string().optional(),
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
    // Allow owner/caregiver; also allow if patient is owner viewing self - caregivers edit
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // VIEWER cannot mark - but OWNER of profile who is patient might be CAREGIVER/OWNER
  // Also allow VIEWER? PRD says patient marks doses - OWNER can. Let's also allow if role is OWNER.
  
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  const med = await prisma.medication.findFirst({
    where: { id: parsed.data.medicationId, profileId },
  });
  if (!med) return NextResponse.json({ error: "Medication not found" }, { status: 404 });

  const existing = await prisma.doseEvent.findFirst({
    where: { profileId, medicationId: med.id, scheduledAt },
  });

  const doseEvent = existing
    ? await prisma.doseEvent.update({
        where: { id: existing.id },
        data: {
          status: parsed.data.status,
          note: parsed.data.note,
          actorUserId: user.id,
        },
      })
    : await prisma.doseEvent.create({
        data: {
          profileId,
          medicationId: med.id,
          scheduledAt,
          status: parsed.data.status,
          note: parsed.data.note,
          actorUserId: user.id,
        },
      });

  return NextResponse.json({ doseEvent });
}
