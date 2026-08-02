import { NextResponse } from "next/server";
import { getSessionUser, requireProfileAccess } from "@/lib/auth";
import { runPrepareAgent } from "@/lib/agents/prepare";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hint = new URL(req.url).searchParams.get("hint") ?? undefined;
  const { packet } = await runPrepareAgent(profileId, hint);
  return NextResponse.json({ packet });
}
