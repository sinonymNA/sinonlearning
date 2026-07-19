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

    this.add.rectangle(960, 540, 1920, 1080, 0x07111d, 0.26);
    this.add.image(960, 250, "wilds_logo").setScale(0.68);

    wildsText(this, 960, 418, "A creature adventure where answering questions is how you fight.", 25, "#effffb", {
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

    const btnNewRun = imageButton(this, 650, 610, "btn_primary", "", startExpedition, 380, 132);
    const labelNewRun = wildsText(this, 0, 78, "Explore the Verdant Rift", 17, "#e6fff9").setOrigin(0.5);
    btnNewRun.add(labelNewRun);

    const btnQuickStart = imageButton(this, 1270, 610, "btn_secondary", "", replayExpedition, 410, 132);
    const labelQuickStart = wildsText(this, 0, 78, "Start a fresh field expedition", 17, "#e6fff9").setOrigin(0.5);
    btnQuickStart.add(labelQuickStart);

    const btnCollection = imageButton(this, 650, 765, "btn_purple", "", () => this.toggleCollection(), 390, 132);
    btnCollection.setAlpha(0.96);
    const labelCollection = wildsText(this, 0, 78, "View your captured Wilds", 17, "#eadbff").setOrigin(0.5);
    btnCollection.add(labelCollection);

    const btnResume = imageButton(this, 1270, 765, "btn_gold", "", replayExpedition, 390, 132);
    btnResume.setAlpha(1);
    const labelResume = wildsText(this, 0, 78, "Replay Verdant Rift anytime", 17, "#fff2c9").setOrigin(0.5);
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
