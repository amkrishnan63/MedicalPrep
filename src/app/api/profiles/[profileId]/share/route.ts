import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const members = await prisma.membership.findMany({
    where: { profileId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ members, role });
}

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["CAREGIVER", "VIEWER"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "OWNER");
  if (!role) return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!invitee) {
    return NextResponse.json(
      {
        error:
          "No account with that email. Ask them to register first, then invite again.",
      },
      { status: 404 },
    );
  }

  const membership = await prisma.membership.upsert({
    where: { profileId_userId: { profileId, userId: invitee.id } },
    create: { profileId, userId: invitee.id, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  await audit({
    actorId: user.id,
    profileId,
    action: "share.invite",
    entityRef: invitee.id,
    payload: { role: parsed.data.role },
  });

  return NextResponse.json({ membership });
}
