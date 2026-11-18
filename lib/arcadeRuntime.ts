// @ts-nocheck - bridges the plain-ESM arcade engine into the Next.js node runtime
import { ArcadeService } from "../arcade-server/service.mjs";
import { MemoryStore } from "../arcade-server/store.mjs";
import { sequenceBank } from "../arcade-server/dictionary.mjs";
import { PgStore } from "./arcadeDb";

/**
 * Rooms live in this process's memory (same pattern as /api/suspect). One Node instance serves the whole
 * classroom; if the deployment ever runs several instances, rooms need sticky routing or a shared store.
 */
const g = globalThis as typeof globalThis & { __arcade?: { service: ArcadeService; store: any } };

export function getArcade() {
  if (!g.__arcade) {
    const store = process.env.DATABASE_URL ? new PgStore() : new MemoryStore();
    const service = new ArcadeService({ onAward: (award) => { Promise.resolve(store.award(award)).catch((e) => console.error("arcade award failed", e)); } });
    sequenceBank(); // warm the dictionary so the first Hot Potato round is instant
    service.startTicker(250);
    g.__arcade = { service, store };
  }
  return g.__arcade;
}
