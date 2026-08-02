import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      allergies: true,
      medications: { orderBy: { displayName: "asc" } },
      memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
      studyEnrollment: true,
    },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile, role });
}

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  birthYear: z.number().int().optional().nullable(),
  otcPromptCompleted: z.boolean().optional(),
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
  const profile = await prisma.profile.update({
    where: { id: profileId },
    data: parsed.data,
  });
  return NextResponse.json({ profile });
}
