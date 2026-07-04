import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSessionUser, type MarginsUser } from "./marginsDb";

const COOKIE_NAME = "margins_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSessionCookie(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const token = await createSession(userId, expiresAt);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await deleteSession(token);
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<MarginsUser | undefined> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return undefined;
  return getSessionUser(token);
}
