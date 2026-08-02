import { prisma } from "./prisma";

export async function resolveProfileId(userId: string, profileId?: string | null) {
  if (profileId) {
    const membership = await prisma.membership.findUnique({
      where: { profileId_userId: { profileId, userId } },
      include: { profile: true },
    });
    if (membership) return membership.profile;
  }
  const first = await prisma.membership.findFirst({
    where: { userId },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });
  return first?.profile ?? null;
}
