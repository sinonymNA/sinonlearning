import Phaser from "phaser";
import { type GameState } from "../GameState";
import type { BoardScene } from "./BoardScene";
import { PLACEHOLDER } from "../AssetManifest";

// Phase 6 placeholder — full free-movement crate break minigame to be built
export class CrateBreakScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: "CrateBreakScene" });
  }

  init(data: { state: GameState }) {
    this.gameState = data.state;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x00001a, 1).setOrigin(0);
    this.add.text(W / 2, H / 2 - 30, "CRATE BREAK", {
      fontSize: "32px", fontFamily: "sans-serif", color: "#8b5cf6", fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 16, "Coming in Phase 6", {
      fontSize: "16px", fontFamily: "sans-serif", color: "#94a3b8",
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 70, "Continue →", {
      fontSize: "15px", fontFamily: "sans-serif", color: "#ffffff",
      backgroundColor: "#8b5cf6", padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => {
      this.scene.stop("CrateBreakScene");
      this.scene.resume("BoardScene");
      const board = this.scene.get("BoardScene") as BoardScene;
      const rewards = this.gameState.players.map(p => ({ playerId: p.id, coins: Phaser.Math.Between(1, 5) }));
      board.onMinigameComplete(rewards);
    });
  }
}
