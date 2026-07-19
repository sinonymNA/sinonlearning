"use client";

import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { ExpeditionScene } from "./scenes/ExpeditionScene";
import { regionById } from "./regions";

export function createPhaserGame(parent: HTMLElement, equippedCapId = "cap-fox", regionId?: string): Phaser.Game {
  const region = regionById(regionId);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: "#08121f",
    scene: [new BootScene(equippedCapId, region), new TitleScene(region), new ExpeditionScene(region)],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
  });
}
