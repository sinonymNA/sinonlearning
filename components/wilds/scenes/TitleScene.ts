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

    this.add.rectangle(960, 540, 1920, 1080, 0x07111d, 0.22);
    this.add.image(960, 230, "wilds_logo").setScale(0.84);

    wildsText(this, 960, 380, "A creature adventure where answering questions is how you fight.", 28, "#effffb", {
      align: "center",
      wordWrap: { width: 980 },
    }).setOrigin(0.5);

    const btnNewRun = imageButton(this, 640, 600, "btn_primary", "", () => {
      clearRunSave();
      this.cameras.main.fadeOut(280, 8, 18, 31);
      this.time.delayedCall(280, () => this.scene.start("ExpeditionScene"));
    }, 420, 150);
    const labelNewRun = wildsText(this, 0, 90, "Explore the Verdant Rift", 18, "#e6fff9").setOrigin(0.5);
    btnNewRun.add(labelNewRun);

    const btnQuickStart = imageButton(this, 1280, 600, "btn_secondary", "", () => {
      this.cameras.main.fadeOut(280, 8, 18, 31);
      this.time.delayedCall(280, () => this.scene.start("ExpeditionScene"));
    }, 460, 150);
    const labelQuickStart = wildsText(this, 0, 90, "Start a fresh field expedition", 18, "#e6fff9").setOrigin(0.5);
    btnQuickStart.add(labelQuickStart);

    const btnCollection = imageButton(this, 640, 780, "btn_purple", "", () => this.toggleCollection(), 430, 150);
    btnCollection.setAlpha(0.96);
    const labelCollection = wildsText(this, 0, 90, "View your captured Wilds", 18, "#eadbff").setOrigin(0.5);
    btnCollection.add(labelCollection);

    const btnResume = imageButton(this, 1280, 780, "btn_gold", "", () => {
      this.cameras.main.fadeOut(280, 8, 18, 31);
      this.time.delayedCall(280, () => this.scene.start("ExpeditionScene"));
    }, 430, 150);
    btnResume.setAlpha(1);
    const labelResume = wildsText(this, 0, 90, "Replay Verdant Rift anytime", 18, "#fff2c9").setOrigin(0.5);
    btnResume.add(labelResume);
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
      20,
      "#cfeff8",
      { align: "center", wordWrap: { width: 820 } },
    ).setOrigin(0.5);

    const names = save.wildsCollection.length > 0
      ? save.wildsCollection.map((id) => id.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())).join("   •   ")
      : "No Wilds captured yet. Your collection will grow after successful capsule catches.";
    const body = wildsText(this, 960, 470, names, 22, "#f8fafc", {
      align: "center",
      wordWrap: { width: 820 },
    }).setOrigin(0.5);
    const close = wildsText(this, 960, 740, "Tap anywhere to close", 18, "#9dd8e8").setOrigin(0.5);

    scrim.on("pointerup", () => this.toggleCollection());
    this.collectionOverlay = this.add.container(0, 0, [scrim, panel, title, stats, body, close]);
  }
}
