import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";

// TitleScene: shows the Capsule Party logo and a "Waiting for host..." or "Enter Code" prompt.
// In production this scene bridges to the real lobby once the React shell passes player data.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background gradient feel (solid dark + accent strip)
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 1).setOrigin(0);
    this.add.rectangle(0, H - 4, W, 4, 0x19cdd2, 1).setOrigin(0);

    // Logo text (placeholder until real logo image provided)
    const title = this.add.text(W / 2, H * 0.28, "CAPSULE PARTY", {
      fontSize: "52px", fontFamily: "sans-serif", color: "#19cdd2", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 6,
    }).setOrigin(0.5);

    const sub = this.add.text(W / 2, H * 0.28 + 70, "Collect. Compete. Win.", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#94a3b8",
    }).setOrigin(0.5);

    // Floating animated coins (placeholder)
    for (let i = 0; i < 8; i++) {
      const cx = Phaser.Math.Between(40, W - 40);
      const cy = Phaser.Math.Between(H * 0.6, H - 40);
      const coin = this.add.circle(cx, cy, 8, PLACEHOLDER.COIN_COLOR, 0.7);
      this.tweens.add({
        targets: coin, y: cy - Phaser.Math.Between(30, 70), alpha: 0,
        duration: Phaser.Math.Between(1800, 3200), ease: "Cubic.Out",
        delay: Phaser.Math.Between(0, 2000), repeat: -1, yoyo: false,
        onRepeat: () => { coin.setY(cy); coin.setAlpha(0.7); },
      });
    }

    // Waiting indicator
    const waiting = this.add.text(W / 2, H * 0.65, "Waiting for game...", {
      fontSize: "15px", fontFamily: "sans-serif", color: "#64748b",
    }).setOrigin(0.5);

    // Blink the dots
    let dots = 0;
    this.time.addEvent({
      delay: 600, repeat: -1, callback: () => {
        dots = (dots + 1) % 4;
        waiting.setText("Waiting for game" + ".".repeat(dots));
      },
    });

    // Entrance animations
    this.tweens.add({ targets: title, y: H * 0.28 - 8, duration: 2000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.tweens.add({ targets: sub, alpha: { from: 0.4, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    // Listen for host to start the lobby
    EventBus.once("party:join", (data) => {
      this.scene.start("LobbyScene", { initialPlayer: data });
    });

    EventBus.emit("phaser:ready");
  }
}
