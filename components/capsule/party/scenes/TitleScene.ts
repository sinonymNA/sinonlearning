import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { imageButton, partyText } from "../Presentation";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    const backdrop = this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W * 1.12, H * 1.12);
    this.add.rectangle(0, 0, W, H, 0x020817, 0.36).setOrigin(0);
    this.add.ellipse(W / 2, 160, 690, 320, 0x07142f, 0.44);

    const logoGlow = this.add.ellipse(W / 2, 142, 520, 160, 0x19cdd2, 0.08).setDepth(3);
    const logo = this.add.image(W / 2, 126, "capsule-party-logo").setDisplaySize(470, 220).setDepth(5);
    this.tweens.add({ targets: [logo, logoGlow], y: "-=4", duration: 2100, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    const heroIds = ["fox", "astropup", "dragon", "penguin"];
    const heroXs = [210, 322, 478, 590];
    heroIds.forEach((id, index) => {
      const color = [0x19cdd2, 0xff6b35, 0x7c3aed, 0x16a34a][index];
      const y = index === 0 || index === 3 ? 288 : 274;
      const pedestal = this.add.ellipse(heroXs[index], y + 45, 100, 25, color, 0.35).setStrokeStyle(2, color, 0.9);
      const key = `cap-char-${id}-${index}`;
      const portrait = this.add.image(heroXs[index], y, this.textures.exists(key) ? key : `cap-${id}`).setDisplaySize(78, 78);
      this.tweens.add({ targets: [portrait, pedestal], y: "-=6", duration: 1100 + index * 120, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    });

    const launchGlow = this.add.ellipse(W / 2, 373, 360, 70, 0x19cdd2, 0.15).setDepth(19);
    this.tweens.add({ targets: launchGlow, scaleX: 1.08, alpha: 0.06, duration: 1200, yoyo: true, repeat: -1 });
    imageButton(this, W / 2, 363, "START THE PARTY", () => {
      this.cameras.main.flash(220, 255, 209, 102);
      this.time.delayedCall(180, () => EventBus.emit("party:join", {
        playerId: "player-local", displayName: "You", capId: "cap-fox",
      }));
    }, { width: 326, height: 72, fontSize: 20 }).setDepth(20);

    partyText(this, W / 2, 418, "QUIZ  •  RACE  •  RAID  •  REPEAT", 12, "#dbeafe", {
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.tweens.add({ targets: backdrop, scale: 1.03, duration: 6000, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    EventBus.once("party:join", (data) => this.scene.start("LobbyScene", { initialPlayer: data }));
    EventBus.emit("phaser:phase-change", { phase: "title" });
    EventBus.emit("phaser:ready");
  }
}

