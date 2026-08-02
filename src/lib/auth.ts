import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE = "mp_session";
const SESSION_DAYS = 14;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    jar.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export type AccessRole = "OWNER" | "CAREGIVER" | "VIEWER";

export async function getProfileAccess(profileId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { profileId_userId: { profileId, userId } },
  });
  if (!membership) return null;
  return membership.role as AccessRole;
}

export async function requireProfileAccess(
  profileId: string,
  userId: string,
  minRole: AccessRole = "VIEWER",
) {
  const role = await getProfileAccess(profileId, userId);
  if (!role) return null;
  const rank = { VIEWER: 1, CAREGIVER: 2, OWNER: 3 };
  if (rank[role] < rank[minRole]) return null;
  return role;
}

export function canEdit(role: AccessRole) {
  return role === "OWNER" || role === "CAREGIVER";
}
