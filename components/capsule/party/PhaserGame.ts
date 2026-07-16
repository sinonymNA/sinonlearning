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
    width: 800,
    height: 450,
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
    },
  });
}
