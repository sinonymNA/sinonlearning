// Typed re-exports of the arcade engine's static data for client components.
import { GAME_CATALOG as RAW_CATALOG, GAME_IDS as RAW_IDS, MAX_PLAYERS as RAW_MAX, AVATARS as RAW_AVATARS, TEAMS as RAW_TEAMS } from "../arcade-server/catalog.mjs";
import { CHARACTERS as RAW_CHARS, RARITIES as RAW_RARITIES, STARTER_AVATARS as RAW_STARTERS, packOdds as rawPackOdds } from "../arcade-server/characters.mjs";

export type GameInfo = { id: string; name: string; icon: string; color: string; min: number; ref: number; minutes: string; blurb: string };
export const GAME_CATALOG: Record<string, GameInfo> = RAW_CATALOG;
export const GAME_IDS: string[] = RAW_IDS;
export const MAX_PLAYERS: number = RAW_MAX;
export const AVATARS: string[] = RAW_AVATARS;
export const TEAMS: { id: number; name: string; color: string }[] = RAW_TEAMS;
export const CHARACTERS: { id: string; name: string; rarity: string; tagline: string }[] = RAW_CHARS;
export const RARITIES: Record<string, { label: string; weight: number; color: string }> = RAW_RARITIES;
export const STARTER_AVATARS: { id: string; name: string }[] = RAW_STARTERS;
export const packOdds = rawPackOdds as (id?: string) => { pack: { id: string; name: string; cost: number }; rarities: { id: string; label: string; percent: number }[]; characters: { id: string; name: string; rarity: string; percent: number }[] };
