import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";

// TitleScene: shows the Capsule Party logo and a "Waiting for host..." or "Enter Code" prompt.
// In production this scene bridges to the real lobby once the React shell passes player data.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, 0x020817, 0.68).setOrigin(0);
    this.add.rectangle(W / 2, H / 2 + 6, 510, 352, 0x07142f, 0.9)
      .setStrokeStyle(5, 0xffd166).setOrigin(0.5);
    this.add.image(W / 2, 82, "grand-cap-art").setDisplaySize(76, 76).setDepth(3);

    // Logo text (placeholder until real logo image provided)
    const title = this.add.text(W / 2, 126, "CAPSULE PARTY", {
      fontSize: "46px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 9,
    }).setOrigin(0.5);
    title.setShadow(0, 6, "#19cdd2", 0, true, true);

    const sub = this.add.text(W / 2, 174, "QUIZ. RACE. RAID. REPEAT.", {
      fontSize: "13px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold",
    }).setOrigin(0.5);

    const soloButton = this.add.container(W / 2, 242).setDepth(20);
    const soloShadow = this.add.rectangle(0, 8, 286, 64, 0x020817, 1).setOrigin(0.5).setStrokeStyle(5, 0x020817);
    const soloBg = this.add.rectangle(0, 0, 286, 64, 0x19cdd2, 1).setOrigin(0.5).setStrokeStyle(5, 0xffffff).setInteractive({ useHandCursor: true });
    const soloText = this.add.text(0, 0, "START SOLO PARTY", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#071226", fontStyle: "bold",
    }).setOrigin(0.5);
    soloButton.add([soloShadow, soloBg, soloText]);
    soloBg.on("pointerover", () => soloButton.setScale(1.04));
    soloBg.on("pointerout", () => soloButton.setScale(1));
    soloBg.on("pointerdown", () => {
      soloBg.disableInteractive();
      EventBus.emit("party:join", { playerId: "player-local", displayName: "You", capId: "cap-fox" });
    });

    // Floating collectible art
    for (let i = 0; i < 8; i++) {
      const cx = Phaser.Math.Between(40, W - 40);
      const cy = Phaser.Math.Between(H * 0.6, H - 40);
      const coin = this.add.image(cx, cy, i % 4 === 0 ? "coin-fake-art" : "coin-gold-art")
        .setDisplaySize(30, 30).setAlpha(0.78);
      this.tweens.add({
        targets: coin, y: cy - Phaser.Math.Between(30, 70), alpha: 0,
        duration: Phaser.Math.Between(1800, 3200), ease: "Cubic.Out",
        delay: Phaser.Math.Between(0, 2000), repeat: -1, yoyo: false,
        onRepeat: () => { coin.setY(cy); coin.setAlpha(0.78); },
      });
    }

    // Waiting indicator
    const waiting = this.add.text(W / 2, 294, "Or waiting for a hosted game...", {
      fontSize: "13px", fontFamily: "sans-serif", color: "#9fb4d8",
    }).setOrigin(0.5);

    // Blink the dots
    let dots = 0;
    this.time.addEvent({
      delay: 600, repeat: -1, callback: () => {
        dots = (dots + 1) % 4;
        waiting.setText("Or waiting for a hosted game" + ".".repeat(dots));
      },
    });

    // Entrance animations
    this.tweens.add({ targets: title, y: 120, duration: 2000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.tweens.add({ targets: sub, alpha: { from: 0.4, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    // Listen for host to start the lobby
    EventBus.once("party:join", (data) => {
      this.scene.start("LobbyScene", { initialPlayer: data });
    });

    EventBus.emit("phaser:phase-change", { phase: "title" });
    EventBus.emit("phaser:ready");
  }
}

