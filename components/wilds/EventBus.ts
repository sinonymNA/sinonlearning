"use client";

import Phaser from "phaser";

export type WildsEventMap = {
  "phaser:ready": void;
};

class TypedEventBus extends Phaser.Events.EventEmitter {
  emit<K extends keyof WildsEventMap>(event: K, data?: WildsEventMap[K]): boolean {
    return super.emit(event as string, data);
  }
  on<K extends keyof WildsEventMap>(event: K, fn: (data: WildsEventMap[K]) => void, context?: unknown): this {
    return super.on(event as string, fn, context);
  }
  off<K extends keyof WildsEventMap>(event: K, fn?: (data: WildsEventMap[K]) => void, context?: unknown): this {
    return super.off(event as string, fn, context);
  }
}

export const EventBus = new TypedEventBus();
