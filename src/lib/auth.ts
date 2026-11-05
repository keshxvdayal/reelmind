import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mutate, newToken, readDb } from "@/lib/store";
import type { User } from "@/lib/types";

export const SESSION_COOKIE = "rm_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function startSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await mutate((db) => {
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    db.sessions.push({ token, userId, expiresAt: expiresAt.toISOString() });
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await mutate((db) => void (db.sessions = db.sessions.filter((s) => s.token !== token)));
  store.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

/** For pages: redirect to /login when signed out. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers: a 401 response when signed out. */
export async function apiUser(): Promise<User | Response> {
  return (await currentUser()) ?? Response.json({ error: "Sign in first." }, { status: 401 });
}
