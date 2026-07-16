"use client";

import Phaser from "phaser";

export type EventMap = {
  // React → Phaser
  "party:join": { playerId: string; displayName: string; capId: string };
  "party:start": void;
  // Phaser → React
  "phaser:ready": void;
  "phaser:phase-change": { phase: string };
  "phaser:question": { q: string; choices: string[]; timeLimit: number };
  "phaser:answer-result": { correct: boolean; spinResult: number };
  "phaser:score-update": PlayerScore[];
  "phaser:game-over": { ranking: PlayerScore[] };
};

export interface PlayerScore {
  id: string;
  displayName: string;
  capId: string;
  grandCaps: number;
  coins: number;
  accuracy: number;
}

// Typed wrapper around Phaser.Events.EventEmitter
class TypedEventBus extends Phaser.Events.EventEmitter {
  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): boolean {
    return super.emit(event as string, data);
  }
  on<K extends keyof EventMap>(event: K, fn: (data: EventMap[K]) => void, context?: unknown): this {
    return super.on(event as string, fn, context);
  }
  off<K extends keyof EventMap>(event: K, fn?: (data: EventMap[K]) => void, context?: unknown): this {
    return super.off(event as string, fn, context);
  }
  once<K extends keyof EventMap>(event: K, fn: (data: EventMap[K]) => void, context?: unknown): this {
    return super.once(event as string, fn, context);
  }
}

export const EventBus = new TypedEventBus();
