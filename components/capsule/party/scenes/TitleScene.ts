import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    const backdrop = this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W * 1.12, H * 1.12);
    this.add.rectangle(0, 0, W, H, 0x020817, 0.42).setOrigin(0);
    this.add.ellipse(W / 2, 165, 670, 330, 0x07142f, 0.54);

    const crownGlow = this.add.circle(W / 2, 80, 48, 0xffd166, 0.14);
    this.add.image(W / 2, 78, "grand-cap-art").setDisplaySize(84, 84).setDepth(4);
    this.tweens.add({ targets: crownGlow, scale: 1.25, alpha: 0.03, duration: 1200, yoyo: true, repeat: -1 });

    const title = this.add.text(W / 2, 118, "CAPSULE", {
      fontSize: "62px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 10,
    }).setOrigin(0.5).setDepth(5);
    title.setShadow(0, 8, "#19cdd2", 0, true, true);
    this.add.text(W / 2, 174, "P A R T Y", {
      fontSize: "22px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold", letterSpacing: 8,
      stroke: "#07142f", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5);

    const heroIds = ["fox", "astropup", "dragon", "penguin"];
    const heroXs = [210, 322, 478, 590];
    heroIds.forEach((id, index) => {
      const color = [0x19cdd2, 0xff6b35, 0x7c3aed, 0x16a34a][index];
      const y = index === 0 || index === 3 ? 300 : 285;
      const pedestal = this.add.ellipse(heroXs[index], y + 43, 98, 25, color, 0.35).setStrokeStyle(2, color, 0.9);
      const key = `cap-char-${id}-${index}`;
      const portrait = this.add.image(heroXs[index], y, this.textures.exists(key) ? key : `cap-${id}`).setDisplaySize(72, 72);
      this.tweens.add({ targets: [portrait, pedestal], y: "-=6", duration: 1100 + index * 120, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    });

    const launch = this.add.container(W / 2, 365).setDepth(20);
    const glow = this.add.ellipse(0, 12, 340, 78, 0x19cdd2, 0.22);
    const plate = this.add.graphics();
    plate.fillStyle(0xffd166, 1);
    plate.fillRoundedRect(-153, -29, 306, 58, 29);
    plate.lineStyle(5, 0xffffff, 0.9);
    plate.strokeRoundedRect(-153, -29, 306, 58, 29);
    const hit = this.add.zone(0, 0, 306, 58).setInteractive({ useHandCursor: true });
    const label = this.add.text(0, 0, "START THE PARTY", {
      fontSize: "20px", fontFamily: "sans-serif", color: "#07142f", fontStyle: "bold",
    }).setOrigin(0.5);
    launch.add([glow, plate, hit, label]);
    hit.on("pointerover", () => launch.setScale(1.05));
    hit.on("pointerout", () => launch.setScale(1));
    hit.once("pointerdown", () => {
      hit.disableInteractive();
      this.cameras.main.flash(220, 255, 209, 102);
      this.time.delayedCall(180, () => EventBus.emit("party:join", {
        playerId: "player-local", displayName: "You", capId: "cap-fox",
      }));
    });

    this.add.text(W / 2, 415, "QUIZ  •  RACE  •  RAID  •  REPEAT", {
      fontSize: "12px", fontFamily: "sans-serif", color: "#dbeafe", fontStyle: "bold", letterSpacing: 2,
    }).setOrigin(0.5);
    this.tweens.add({ targets: backdrop, scale: 1.03, duration: 6000, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    EventBus.once("party:join", (data) => this.scene.start("LobbyScene", { initialPlayer: data }));
    EventBus.emit("phaser:phase-change", { phase: "title" });
    EventBus.emit("phaser:ready");
  }
}

