import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchDrugs } from "@/lib/interactions";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const drugs = await searchDrugs(q);
  return NextResponse.json({ drugs });
}
