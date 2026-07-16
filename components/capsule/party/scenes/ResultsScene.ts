import Phaser from "phaser";
import { type PlayerState } from "../GameState";
import { PLACEHOLDER } from "../AssetManifest";
import { EventBus } from "../EventBus";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: "ResultsScene" });
  }

  init(data: { ranked: PlayerState[] }) {
    this.data.set("ranked", data.ranked);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const ranked = this.data.get("ranked") as PlayerState[];

    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 0.78).setOrigin(0);

    this.add.text(W / 2, 30, "GAME OVER", {
      fontSize: "42px", fontFamily: "sans-serif", color: "#ffd700", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5);

    const medalColors = ["#ffd700", "#c0c0c0", "#cd7f32", "#e2e8f0"];
    const medalLabels = ["1st Place!", "2nd Place", "3rd Place", "4th Place"];

    ranked.forEach((p, i) => {
      const y = 110 + i * 75;
      const color = PLACEHOLDER.PLAYER_COLORS[p.colorIndex] ?? 0x334155;

      this.add.rectangle(W / 2, y + 30, W - 110, 60, 0x07142f, 0.94).setOrigin(0.5).setStrokeStyle(3, color);
      if (this.textures.exists(p.capId)) this.add.image(88, y + 30, p.capId).setDisplaySize(48, 48);
      this.add.text(122, y + 8, medalLabels[i] ?? `#${i + 1}`, {
        fontSize: "14px", fontFamily: "sans-serif", color: medalColors[i] ?? "#e2e8f0", fontStyle: "bold",
      });
      this.add.text(122, y + 28, p.displayName, {
        fontSize: "22px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      });
      this.add.text(W - 60, y + 8, `â˜… ${p.grandCaps}`, {
        fontSize: "18px", fontFamily: "sans-serif", color: "#ffd700",
      }).setOrigin(1, 0);
      this.add.text(W - 60, y + 32, `G ${p.coins}`, {
        fontSize: "14px", fontFamily: "sans-serif", color: "#e2e8f0",
      }).setOrigin(1, 0);
      const acc = p.totalAnswers > 0 ? Math.round((p.correctAnswers / p.totalAnswers) * 100) : 0;
      this.add.text(W - 60, y + 50, `${acc}% accuracy`, {
        fontSize: "11px", fontFamily: "sans-serif", color: "#94a3b8",
      }).setOrigin(1, 0);
    });

    // Play Again button
    const btn = this.add.text(W / 2, H - 44, "Play Again", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#0f172a",
      backgroundColor: "#19cdd2", padding: { x: 24, y: 10 }, fontStyle: "bold",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => this.scene.start("TitleScene"));
    btn.on("pointerover", () => btn.setBackgroundColor("#10e0e8"));
    btn.on("pointerout", () => btn.setBackgroundColor("#19cdd2"));

    EventBus.emit("phaser:phase-change", { phase: "results" });
  }
}

