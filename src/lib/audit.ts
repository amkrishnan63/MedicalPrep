import { prisma } from "./prisma";

export async function audit(params: {
  actorId?: string | null;
  profileId?: string | null;
  action: string;
  entityRef?: string;
  payload?: unknown;
}) {
  await prisma.auditEvent.create({
    data: {
      actorId: params.actorId ?? undefined,
      profileId: params.profileId ?? undefined,
      action: params.action,
      entityRef: params.entityRef,
      payload: params.payload ? JSON.stringify(params.payload) : undefined,
    },
  });
}
