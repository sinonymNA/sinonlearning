import Phaser from "phaser";
import { captureChance, creatureById, generateUpgradeChoices, REGISTRY_KEYS } from "../gameState";
import { fitBackground, wildsText } from "../Presentation";
import { appendToCollection, getRunSave, registerBattleWin } from "../save";
import type { WildsAudioManager } from "../WildsAudio";
import type { CaptureSceneData } from "../types";

export class CaptureScene extends Phaser.Scene {
  private sceneData!: CaptureSceneData;

  constructor() {
    super({ key: "CaptureScene" });
  }

  init(data: CaptureSceneData) {
    this.sceneData = data;
  }

  create() {
    const run = getRunSave();
    if (!run) {
      this.scene.start("TitleScene");
      return;
    }

    this.cameras.main.fadeIn(220, 8, 18, 31);

    const creature = creatureById(this, this.sceneData.encounterId);
    fitBackground(this, "verdant-battle-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x07111d, 0.28);

    const creatureImage = this.add.image(960, 390, creature.sprite).setDisplaySize(320, 320);
    wildsText(this, 960, 125, `CAPTURE ATTEMPT: ${creature.name.toUpperCase()}`, 34).setOrigin(0.5);

    const capsule = this.add.image(960, 690, "capture_capsule_closed").setDisplaySize(220, 190);
    const top = this.add.image(960, 690, "capture_capsule_top").setDisplaySize(220, 190).setVisible(false);
    const bottom = this.add.image(960, 720, "capture_capsule_bottom").setDisplaySize(220, 190).setVisible(false);
    const status = wildsText(this, 960, 865, "The capsule beam locks on...", 24).setOrigin(0.5);

    this.tweens.add({
      targets: creatureImage,
      y: 690,
      scale: 0.12,
      alpha: 0.15,
      duration: 650,
      ease: "Quad.easeIn",
      onComplete: () => {
        creatureImage.setVisible(false);
        top.setVisible(true);
        bottom.setVisible(true);
        capsule.setVisible(false);
        this.tweens.add({ targets: top, y: 610, duration: 260, ease: "Quad.easeOut" });
        this.tweens.add({ targets: bottom, y: 760, duration: 260, ease: "Quad.easeOut" });
        status.setText("One... Two... Three...");

        this.time.delayedCall(700, () => {
          const audio = this.registry.get(REGISTRY_KEYS.wildsAudio) as WildsAudioManager | undefined;
          const lastBattle = this.registry.get(REGISTRY_KEYS.lastBattleResult) as { perfect?: boolean } | undefined;
          const lucky = Number(this.registry.get(REGISTRY_KEYS.playerLuckyBuff) ?? 0);
          this.registry.remove(REGISTRY_KEYS.playerLuckyBuff);

          const abilityBonus = creatureById(this, run.playerCreature).ability === "bonus_capture" ? 0.1 : 0;
          const chance = captureChance(creature.captureRate, run.captureBonus + abilityBonus, lucky, lastBattle?.perfect ? 0.1 : 0);
          const success = Math.random() < chance;

          if (success) {
            audio?.play("capture-success");
            appendToCollection(creature.id);
            registerBattleWin();
            this.add.image(960, 690, "capture_success_burst").setDisplaySize(280, 220);
            status.setText(`${creature.name} was captured!`);
          } else {
            audio?.play("capture-fail");
            this.add.image(960, 690, "capture_fail_puff").setDisplaySize(220, 220);
            status.setText(`${creature.name} broke free!`);
          }

          this.time.delayedCall(950, () => {
            this.cameras.main.fadeOut(280, 8, 18, 31);
            this.time.delayedCall(280, () => {
              this.scene.start("RewardScene", {
                nodeId: this.sceneData.nodeId,
                title: success ? "Victory!" : "Escape!",
                summary: success
                  ? `${creature.name} joins your collection. Choose one reward for the road.`
                  : `${creature.name} slipped away, but you still earn progress for winning the fight.`,
                victory: true,
                captureSuccess: success,
                capturedCreatureId: success ? creature.id : undefined,
                baseCoins: this.sceneData.isBoss ? 35 : creature.rarity === "epic" ? 24 : 16,
                upgradeChoices: generateUpgradeChoices(),
              });
            });
          });
        });
      },
    });
  }
}
