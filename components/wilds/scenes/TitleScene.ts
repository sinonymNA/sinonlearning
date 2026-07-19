import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { fitBackground, imageButton, wildsText } from "../Presentation";
import { clearRunSave, getPermanentSave } from "../save";

export class TitleScene extends Phaser.Scene {
  private collectionOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    EventBus.emit("phaser:ready");
    this.cameras.main.fadeIn(220, 8, 18, 31);

    fitBackground(this, "title-bg");

    this.add.rectangle(960, 540, 1920, 1080, 0x07111d, 0.32);
    const logo = this.add.image(960, 220, "wilds_logo").setDisplaySize(760, 380).setAlpha(0);
    this.tweens.add({ targets: logo, alpha: 1, y: 228, duration: 420, ease: "Back.easeOut" });

    wildsText(this, 960, 410, "Explore procedural rooms. Battle with knowledge. Capture every Wild.", 28, "#effffb", {
      align: "center",
      wordWrap: { width: 980 },
    }).setOrigin(0.5);

    const startExpedition = () => {
      clearRunSave();
      this.scene.start("ExpeditionScene");
    };
    const replayExpedition = () => {
      this.scene.start("ExpeditionScene");
    };

    const btnNewRun = imageButton(this, 650, 570, "btn_primary", "", startExpedition, 380, 178);
    const labelNewRun = wildsText(this, 0, 110, "Begin a new room expedition", 20, "#e6fff9").setOrigin(0.5);
    btnNewRun.add(labelNewRun);

    const btnQuickStart = imageButton(this, 1270, 570, "btn_secondary", "", replayExpedition, 410, 178);
    const labelQuickStart = wildsText(this, 0, 110, "Jump directly into Verdant Rift", 20, "#e6fff9").setOrigin(0.5);
    btnQuickStart.add(labelQuickStart);

    const btnCollection = imageButton(this, 650, 790, "btn_purple", "", () => this.toggleCollection(), 390, 182);
    btnCollection.setAlpha(0.96);
    const labelCollection = wildsText(this, 0, 112, "View your captured Wilds", 20, "#eadbff").setOrigin(0.5);
    btnCollection.add(labelCollection);

    const btnResume = imageButton(this, 1270, 790, "btn_gold", "", replayExpedition, 390, 182);
    btnResume.setAlpha(1);
    const labelResume = wildsText(this, 0, 112, "Replay Verdant Rift anytime", 20, "#fff2c9").setOrigin(0.5);
    btnResume.add(labelResume);

    this.input.keyboard?.once("keydown-ENTER", startExpedition);
    this.input.keyboard?.once("keydown-SPACE", startExpedition);
  }

  private toggleCollection() {
    if (this.collectionOverlay) {
      this.collectionOverlay.destroy(true);
      this.collectionOverlay = null;
      return;
    }

    const save = getPermanentSave();
    const scrim = this.add.rectangle(960, 540, 1920, 1080, 0x04101b, 0.72).setInteractive();
    const panel = this.add.rectangle(960, 540, 980, 620, 0x0d2237, 0.96).setStrokeStyle(4, 0x6ee7f9, 0.4);
    const title = wildsText(this, 960, 270, "COLLECTION", 38, "#ffffff").setOrigin(0.5);
    const stats = wildsText(
      this,
      960,
      330,
      `Captured: ${save.wildsCollection.length}   Battles Won: ${save.stats.battlesWon}   Runs Completed: ${save.stats.runsCompleted}`,
      24,
      "#cfeff8",
      { align: "center", wordWrap: { width: 820 } },
    ).setOrigin(0.5);

    const names = save.wildsCollection.length > 0
      ? save.wildsCollection.map((id) => id.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())).join("   •   ")
      : "No Wilds captured yet. Your collection will grow after successful capsule catches.";
    const body = wildsText(this, 960, 470, names, 26, "#f8fafc", {
      align: "center",
      wordWrap: { width: 820 },
    }).setOrigin(0.5);
    const close = wildsText(this, 960, 740, "Tap anywhere to close", 22, "#9dd8e8").setOrigin(0.5);

    scrim.on("pointerup", () => this.toggleCollection());
    this.collectionOverlay = this.add.container(0, 0, [scrim, panel, title, stats, body, close]);
  }
}
