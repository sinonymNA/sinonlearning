import crypto from "node:crypto";
import { fail } from "./util.mjs";
import { hasPersonalInfo, isClean } from "./moderation.mjs";

/**
 * Minimal arcade accounts: username + password ONLY. No email, no real name, no class, no recovery
 * address. The account exists purely to keep coins and collected characters. Game nicknames are chosen
 * freely per game and are never linked to the account.
 */
export const SESSION_DAYS = 30;

export function cleanUsername(raw) {
  const u = String(raw ?? "").trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) fail("Username must be 3-20 letters, numbers or underscores.");
  if (!isClean(u) || hasPersonalInfo(u)) fail("Pick a different username (please don't use your real name or personal info).");
  return u;
}

export function cleanPassword(raw, username = "") {
  const p = String(raw ?? "");
  if (p.length < 6 || p.length > 72) fail("Password must be 6-72 characters.");
  if (username && p.toLowerCase() === username.toLowerCase()) fail("Password can't be the same as your username.");
  return p;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored ?? "").split(":");
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(password, salt, 64), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export async function signup(store, { username, password }) {
  const name = cleanUsername(username);
  cleanPassword(password, name);
  const account = await store.createAccount({ username: name, passwordHash: hashPassword(password) });
  return account; // { id, username }
}

export async function login(store, { username, password }) {
  const acc = await store.getAccountByUsername(String(username ?? "").trim());
  // constant-ish work even when the user is unknown, so response time doesn't reveal which usernames exist
  const ok = verifyPassword(String(password ?? ""), acc?.passwordHash ?? "00:00");
  if (!acc || !ok) fail("Wrong username or password.");
  return { id: acc.id, username: acc.username };
}

export async function startSession(store, accountId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await store.createSession({ tokenHash: hashToken(token), accountId, expiresAt });
  return { token, expiresAt };
}

/** Returns the minimal ArcadeUser for a session token, or undefined. */
export async function userFromToken(store, token) {
  if (!token) return undefined;
  const acc = await store.getSessionAccount(hashToken(token));
  return acc ? { id: `acct:${acc.id}`, accountId: acc.id, email: "", role: "student", name: acc.username, kind: "arcade" } : undefined;
}
