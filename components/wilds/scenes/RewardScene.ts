import Phaser from "phaser";
import { creatureById } from "../gameState";
import { fitBackground, imageButton, wildsText } from "../Presentation";
import { applyUpgradeToRun, getPermanentSave, getRunSave, grantCoins, registerRunComplete, setRunSave } from "../save";
import type { RewardSceneData, UpgradeChoice } from "../types";

export class RewardScene extends Phaser.Scene {
  private sceneData!: RewardSceneData;

  constructor() {
    super({ key: "RewardScene" });
  }

  init(data: RewardSceneData) {
    this.sceneData = data;
  }

  create() {
    this.cameras.main.fadeIn(220, 8, 18, 31);
    fitBackground(this, "verdant-map-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x08121f, 0.48);

    const panelKey = this.sceneData.victory ? "results_reward_panel" : "results_summary_panel";
    this.add.image(960, 300, panelKey).setDisplaySize(this.sceneData.victory ? 840 : 620, this.sceneData.victory ? 420 : 420);
    wildsText(this, 960, 180, this.sceneData.title.toUpperCase(), 40, this.sceneData.victory ? "#fdf7ce" : "#ffd3d3").setOrigin(0.5);
    wildsText(this, 960, 270, this.sceneData.summary, 24, "#ffffff", {
      align: "center",
      wordWrap: { width: 700 },
    }).setOrigin(0.5);

    const run = getRunSave();
    const multiplied = run ? Math.round(this.sceneData.baseCoins * (1 + run.coinBonus)) : this.sceneData.baseCoins;
    wildsText(this, 960, 360, `Coins earned: ${multiplied}`, 24, "#f6d485").setOrigin(0.5);

    if (this.sceneData.captureSuccess && this.sceneData.capturedCreatureId) {
      const creature = creatureById(this, this.sceneData.capturedCreatureId);
      this.add.image(280, 300, creature.portrait).setDisplaySize(180, 180);
      wildsText(this, 280, 425, creature.name.toUpperCase(), 22, "#b8fff1").setOrigin(0.5);
    } else if (!this.sceneData.victory) {
      this.add.image(960, 720, "results_defeat_badge").setDisplaySize(240, 180);
    }

    if (this.sceneData.victory && this.sceneData.upgradeChoices?.length) {
      wildsText(this, 960, 545, "Choose one reward", 28, "#d7f7f0").setOrigin(0.5);
      this.drawUpgradeChoices(this.sceneData.upgradeChoices, multiplied);
    } else {
      this.finishReward(null, multiplied);
    }
  }

  private drawUpgradeChoices(choices: UpgradeChoice[], multiplied: number) {
    choices.forEach((choice, index) => {
      const x = 500 + index * 460;
      const y = 770;
      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 340, 190, 0x0e2138, 0.95).setStrokeStyle(3, 0x6ee7f9, 0.4);
      const title = wildsText(this, 0, -34, choice.label, 22, "#ffffff", {
        align: "center",
        wordWrap: { width: 260 },
      }).setOrigin(0.5);
      const desc = wildsText(this, 0, 26, choice.description, 16, "#d8e9f2", {
        align: "center",
        wordWrap: { width: 280 },
      }).setOrigin(0.5);
      const hitbox = this.add.rectangle(0, 0, 340, 190, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hitbox.on("pointerover", () => card.setScale(1.03));
      hitbox.on("pointerout", () => card.setScale(1));
      hitbox.on("pointerdown", () => card.setScale(0.98));
      hitbox.on("pointerup", () => this.finishReward(choice, multiplied));
      card.add([bg, title, desc, hitbox]);
    });
  }

  private finishReward(choice: UpgradeChoice | null, multiplied: number) {
    const run = getRunSave();
    if (!run) {
      imageButton(this, 960, 930, "results_continue_button", "BACK TO TITLE", () => {
        this.cameras.main.fadeOut(280, 8, 18, 31);
        this.time.delayedCall(280, () => this.scene.start("TitleScene"));
      }, 320, 118);
      return;
    }

    grantCoins(multiplied);
    run.coinsEarned += multiplied;
    run.completedNodes = Array.from(new Set([...run.completedNodes, this.sceneData.nodeId]));
    if (choice) {
      const next = applyUpgradeToRun(run, choice);
      setRunSave(next);
    } else {
      setRunSave(run);
    }

    const nodes = this.cache.json.get("wilds-nodes") as Array<{ id: string; next: string[] }>;
    const currentNode = nodes.find((node) => node.id === run.currentNode);
    const isRunComplete = currentNode && currentNode.next.length === 0 && this.sceneData.victory;

    if (isRunComplete) {
      registerRunComplete();
      this.showRunComplete(run.coinsEarned);
      return;
    }

    imageButton(this, 960, 960, "results_continue_button", this.sceneData.victory ? "CONTINUE" : "RETURN TO TITLE", () => {
      this.cameras.main.fadeOut(280, 8, 18, 31);
      this.time.delayedCall(280, () => {
        if (this.sceneData.victory) {
          this.scene.start("MapScene");
        } else {
          this.scene.start("TitleScene");
        }
      });
    }, 320, 118);
  }

  private showRunComplete(totalCoinsEarned: number) {
    const perm = getPermanentSave();

    // dim the existing content
    this.add.rectangle(960, 540, 1920, 1080, 0x04101b, 0.80);
    this.add.image(960, 280, "results_victory_badge").setDisplaySize(240, 180);

    wildsText(this, 960, 420, "RUN COMPLETE", 64, "#fdf7ce").setOrigin(0.5);
    wildsText(this, 960, 500, "EXPEDITION COMPLETE — Well done, Trainer.", 28, "#d7f7f0", {
      align: "center",
      wordWrap: { width: 900 },
    }).setOrigin(0.5);

    wildsText(this, 960, 570, `Coins earned this run: ${totalCoinsEarned}`, 24, "#f6d485").setOrigin(0.5);
    wildsText(this, 960, 620, `Battles won all time: ${perm.stats.battlesWon}`, 22, "#c9ffe9").setOrigin(0.5);
    wildsText(this, 960, 666, `Creatures captured all time: ${perm.stats.creaturesCaptured}`, 22, "#b6f4ff").setOrigin(0.5);
    wildsText(this, 960, 712, `Runs completed: ${perm.stats.runsCompleted}`, 22, "#d2b4fe").setOrigin(0.5);

    imageButton(this, 960, 860, "results_continue_button", "BACK TO TITLE", () => {
      this.cameras.main.fadeOut(280, 8, 18, 31);
      this.time.delayedCall(280, () => this.scene.start("TitleScene"));
    }, 320, 118);
  }
}
