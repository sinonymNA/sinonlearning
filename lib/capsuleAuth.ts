import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createCapsuleSession, deleteCapsuleSession, getCapsuleSessionUser, type CapsuleUser } from "./capsuleDb";

const COOKIE = "capsule_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSessionCookie(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  const token = await createCapsuleSession(userId, expiresAt);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await deleteCapsuleSession(token);
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<CapsuleUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return getCapsuleSessionUser(token);
}
