// Typed re-exports of the hub catalog for client components.
import { HUB_GAMES as RAW, MOODS as RAW_MOODS, MAX_VISIBLE as RAW_MAX, RECENT_MAX as RAW_RECENT, shelves as rawShelves, gameForPath as rawGameForPath, pushRecent as rawPushRecent } from "../arcade-server/hub.mjs";

export type HubGame = { id: string; href: string; name: string; mood: string; tagline: string; minutes: string; icon: string; color: string; match: string[] };
export type Mood = { id: string; name: string; sub: string };
export type Shelf = Mood & { shown: HubGame[]; more: HubGame[] };
export type Recent = { id: string; at: number };
export const HUB_GAMES: HubGame[] = RAW;
export const MOODS: Mood[] = RAW_MOODS;
export const MAX_VISIBLE: number = RAW_MAX;
export const RECENT_MAX: number = RAW_RECENT;
export const shelves = (games: HubGame[] = HUB_GAMES): Shelf[] => rawShelves(games);
export const gameForPath = (path: string): string | null => rawGameForPath(path);
export const pushRecent = (list: Recent[], id: string, at: number): Recent[] => rawPushRecent(list, id, at);
export const RECENT_KEY = "arcade:recent";
