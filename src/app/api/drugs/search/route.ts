import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchDrugs } from "@/lib/interactions";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;
  const drugs = await searchDrugs(q, limit);
  return NextResponse.json({ drugs, total: drugs.length });
}
