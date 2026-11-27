import { sanitizeWalkData } from "../../../lib/pacer/walk.mjs";
export type WalkSession = { id: string; start: number; slowSec: number; fastSec: number; totalSec: number; completed: boolean; kcal: number; steps: number; distM: number; basis: "steps" | "time"; book: string };
export type WalkData = { v: 1; units: "metric" | "imperial"; heightCm: number; goalKg: number | null; plan: { intervalMin: number; sets: number; first: "slow" | "fast" }; loud: boolean; buzz: boolean; keepAwake: boolean; bookId: string; sessions: WalkSession[]; weights: { d: string; kg: number }[]; meta: { stepsBefore: number | null; book: string } | null };
const KEY = "walk:v1";
export const loadWalk = (): WalkData => { try { return sanitizeWalkData(JSON.parse(localStorage.getItem(KEY) || "{}")) as WalkData; } catch { return sanitizeWalkData({}) as WalkData; } };
export const saveWalk = (d: WalkData) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ } };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const KG_PER_LB = 0.45359237;
export const latestKg = (d: WalkData): number => d.weights.length ? d.weights[d.weights.length - 1].kg : 70;
