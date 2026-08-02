import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin-lite";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const schema = z.object({
  idToken: z.string().min(10),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseIdToken(parsed.data.idToken);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Firebase auth failed" },
        { status: 401 },
      );
    }

    const name =
      parsed.data.name?.trim() ||
      firebaseUser.displayName ||
      firebaseUser.email.split("@")[0] ||
      "Caregiver";

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: firebaseUser.localId }, { email: firebaseUser.email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: firebaseUser.email,
          name,
          firebaseUid: firebaseUser.localId,
          passwordHash: "", // Firebase owns the password
        },
      });
      await audit({ actorId: user.id, action: "user.firebase_register" });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: firebaseUser.localId,
          email: firebaseUser.email,
          ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
        },
      });
      await audit({ actorId: user.id, action: "user.firebase_login" });
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (e) {
    console.error("[firebase-session]", e);
    const message = e instanceof Error ? e.message : "Could not create app session";
    const isDb =
      /datasource|database|prisma|P1001|P1003|P1010|P1012|Can't reach database/i.test(
        message,
      );
    return NextResponse.json(
      {
        error: isDb
          ? "Database is not configured. Set DATABASE_URL and DIRECT_URL (postgresql://...) in Vercel env vars and redeploy."
          : message,
      },
      { status: 500 },
    );
  }
}
