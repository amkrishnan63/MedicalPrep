import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      profile: {
        include: {
          _count: {
            select: {
              medications: { where: { status: "active" } },
              alerts: { where: { status: "open", severity: "Serious" } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    profiles: memberships.map((m) => ({
      id: m.profile.id,
      displayName: m.profile.displayName,
      role: m.role,
      birthYear: m.profile.birthYear,
      otcPromptCompleted: m.profile.otcPromptCompleted,
      activeMedCount: m.profile._count.medications,
      openSeriousCount: m.profile._count.alerts,
    })),
  });
}

const createSchema = z.object({
  displayName: z.string().min(1),
  birthYear: z.number().int().min(1900).max(2100).optional(),
  timezone: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      displayName: parsed.data.displayName,
      birthYear: parsed.data.birthYear,
      timezone: parsed.data.timezone ?? "America/Los_Angeles",
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  await audit({
    actorId: user.id,
    profileId: profile.id,
    action: "profile.create",
    entityRef: profile.id,
  });

  return NextResponse.json({ profile });
}
