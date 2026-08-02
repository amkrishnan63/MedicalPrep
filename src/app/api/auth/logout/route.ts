import { NextResponse } from "next/server";
import { destroySession, getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST() {
  const user = await getSessionUser();
  await destroySession();
  if (user) await audit({ actorId: user.id, action: "user.logout" });
  return NextResponse.json({ ok: true });
}
