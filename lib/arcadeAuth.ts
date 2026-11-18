import { cookies } from "next/headers";
import { getCurrentUser } from "./marginsAuth";

export interface ArcadeUser { id: string; email: string; role: "teacher" | "student"; name: string }

/**
 * Identity for the arcade, reusing Margins accounts. Only a minimal projection is returned (never the
 * password hash). Anyone can play as a guest (undefined user); coins, collections, hosting and content
 * require an account.
 *
 * Local-only test auth: when NODE_ENV is not "production" AND ARCADE_DEV_AUTH=1, a cookie named
 * `arcade_dev_auth` ("role:id:name") stands in for a Margins session so the lab and load tests can run
 * without a database. It is impossible to enable in a production build.
 */
export async function getArcadeUser(): Promise<ArcadeUser | undefined> {
  if (process.env.NODE_ENV !== "production" && process.env.ARCADE_DEV_AUTH === "1") {
    const raw = (await cookies()).get("arcade_dev_auth")?.value;
    if (raw) {
      const [role, id, name] = decodeURIComponent(raw).split(":");
      if ((role === "teacher" || role === "student") && id) return { id, email: `${id}@dev.local`, role, name: name || id };
    }
  }
  try {
    const user = await getCurrentUser();
    return user ? { id: user.id, email: user.email, role: user.role, name: user.name } : undefined;
  } catch {
    return undefined; // no database configured: everyone is a guest
  }
}
