"use client";

import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { UIScene } from "./scenes/UIScene";
import { BoardScene } from "./scenes/BoardScene";
import { CoinVacuumScene } from "./scenes/CoinVacuumScene";
import { FactoryFloorScene } from "./scenes/FactoryFloorScene";
import { CrateBreakScene } from "./scenes/CrateBreakScene";
import { ResultsScene } from "./scenes/ResultsScene";

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // Render natively at 1080p. The old 1200x675 canvas was enlarged by
    // desktop browsers, softening every text texture, portrait, and UI edge.
    width: 1920,
    height: 1080,
    backgroundColor: "#0a0e1a",
    scene: [
      BootScene,
      TitleScene,
      LobbyScene,
      UIScene,
      BoardScene,
      CoinVacuumScene,
      FactoryFloorScene,
      CrateBreakScene,
      ResultsScene,
    ],
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
    audio: {
      disableWebAudio: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
  });
}

