import Phaser from "phaser";
import {
  creatureById,
  damageForCorrectAnswer,
  getQuestions,
  itemById,
  rarityColor,
  REGISTRY_KEYS,
  scaleToFit,
} from "../gameState";
import { fitBackground, wildsText } from "../Presentation";
import { getRunSave, setRunSave, clearRunSave } from "../save";
import type { BattleSceneData, WildsQuestion } from "../types";

export class BattleScene extends Phaser.Scene {
  private sceneData!: BattleSceneData;
  private streak = 0;
  private questionPool: WildsQuestion[] = [];
  private currentQuestion!: WildsQuestion;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private answerContainers: Phaser.GameObjects.Container[] = [];
  private backpackPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "BattleScene" });
  }

  init(data: BattleSceneData) {
    this.sceneData = data;
  }

  create() {
    const run = getRunSave();
    if (!run) {
      this.scene.start("TitleScene");
      return;
    }

    const player = creatureById(this, run.playerCreature);
    const enemy = creatureById(this, this.sceneData.encounterId);

    fitBackground(this, "verdant-battle-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x09131f, 0.18);

    this.add.image(360, 96, "battle_hp_player_frame").setDisplaySize(540, 112);
    this.add.image(1560, 96, "battle_hp_enemy_frame").setDisplaySize(540, 112);

    const playerSize = scaleToFit(this.textures.get(player.sprite).getSourceImage().width, this.textures.get(player.sprite).getSourceImage().height, 340, 260);
    const enemySize = scaleToFit(this.textures.get(enemy.sprite).getSourceImage().width, this.textures.get(enemy.sprite).getSourceImage().height, 340, 260);

    this.playerSprite = this.add.image(430, 560, player.sprite).setDisplaySize(playerSize.width, playerSize.height);
    this.enemySprite = this.add.image(1450, 410, enemy.sprite).setDisplaySize(enemySize.width, enemySize.height);

    this.tweens.add({ targets: [this.playerSprite, this.enemySprite], y: "-=8", duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    wildsText(this, 165, 80, player.name.toUpperCase(), 24).setOrigin(0, 0.5);
    wildsText(this, 1605, 80, enemy.name.toUpperCase(), 24, rarityColor(enemy.rarity)).setOrigin(1, 0.5);

    this.playerHpText = wildsText(this, 165, 116, `HP ${run.currentHp}/${run.maxHp}`, 18, "#c9ffe9").setOrigin(0, 0.5);
    this.enemyHpText = wildsText(this, 1605, 116, `HP ${enemy.maxHp}/${enemy.maxHp}`, 18, "#ffe2ea").setOrigin(1, 0.5);

    this.add.image(960, 810, "battle_question_panel").setDisplaySize(1220, 240);
    this.add.rectangle(960, 666, 1080, 78, 0x08263f, 0.5).setStrokeStyle(2, 0x6ee7f9, 0.22);
    this.logText = wildsText(this, 960, 666, `A wild ${enemy.name} appears!`, 22, "#ffffff", {
      align: "center",
      wordWrap: { width: 980 },
    }).setOrigin(0.5);

    this.questionPool = Phaser.Utils.Array.Shuffle(getQuestions(this)) as WildsQuestion[];
    this.createAnswerButtons();
    this.createBackpack();
    this.showNextQuestion();
  }

  private createAnswerButtons() {
    const keys = [
      "battle_answer_button_green",
      "battle_answer_button_blue",
      "battle_answer_button_purple",
      "battle_answer_button_gold",
    ];
    const positions = [
      { x: 430, y: 905 },
      { x: 820, y: 905 },
      { x: 1110, y: 905 },
      { x: 1500, y: 905 },
    ];

    keys.forEach((key, index) => {
      const image = this.add.image(0, 0, key).setDisplaySize(310, 126);
      const label = wildsText(this, 0, 0, "", 16, "#ffffff", {
        align: "center",
        wordWrap: { width: 240 },
      }).setOrigin(0.5);
      const container = this.add.container(positions[index].x, positions[index].y, [image, label]);
      const hitbox = this.add.rectangle(0, 0, 310, 126, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hitbox.on("pointerover", () => container.setScale(1.02));
      hitbox.on("pointerout", () => container.setScale(1));
      hitbox.on("pointerdown", () => container.setScale(0.97));
      hitbox.on("pointerup", () => {
        container.setScale(1);
        this.resolveAnswer(index);
      });
      container.add(hitbox);
      this.answerContainers.push(container);
    });
  }

  private createBackpack() {
    const icon = this.add.image(120, 900, "battle_backpack_icon").setDisplaySize(96, 96).setInteractive({ useHandCursor: true });
    icon.on("pointerup", () => this.toggleBackpack());
  }

  private toggleBackpack() {
    if (this.backpackPanel) {
      this.backpackPanel.destroy(true);
      this.backpackPanel = null;
      return;
    }

    const run = getRunSave();
    if (!run) return;

    const bg = this.add.image(330, 820, "battle_item_panel").setDisplaySize(420, 170);
    const title = wildsText(this, 190, 760, "BACKPACK", 18, "#08263f");
    const children: Phaser.GameObjects.GameObject[] = [bg, title];
    const panel = this.add.container(0, 0, children);

    run.items.slice(0, 3).forEach((entry, index) => {
      const def = itemById(this, entry.id);
      const x = 180 + index * 120;
      const icon = this.add.image(x, 842, def.icon).setDisplaySize(76, 76).setInteractive({ useHandCursor: true });
      const qty = wildsText(this, x, 898, `x${entry.quantity}`, 14, "#08263f").setOrigin(0.5);
      icon.on("pointerup", () => this.useItem(entry.id));
      panel.add([icon, qty]);
    });
    this.backpackPanel = panel;
  }

  private useItem(itemId: string) {
    const run = getRunSave();
    if (!run) return;
    const item = run.items.find((entry) => entry.id === itemId && entry.quantity > 0);
    if (!item) return;

    item.quantity -= 1;
    if (item.quantity <= 0) {
      run.items = run.items.filter((entry) => entry.quantity > 0);
    }

    switch (itemId) {
      case "heal_capsule":
        run.currentHp = Math.min(run.maxHp, run.currentHp + 25);
        this.logText.setText("Heal Capsule restores 25 HP.");
        break;
      case "power_capsule":
        this.registry.set(REGISTRY_KEYS.playerAttackBuff, 0.5);
        this.logText.setText("Power Capsule primed. Your next hit will sting.");
        break;
      case "shield_capsule":
        this.registry.set(REGISTRY_KEYS.playerShieldBuff, 0.5);
        this.logText.setText("Shield Capsule ready. The next enemy hit is softened.");
        break;
      case "lucky_capsule":
        this.registry.set(REGISTRY_KEYS.playerLuckyBuff, 0.2);
        this.logText.setText("Lucky Capsule ready for the next capture.");
        break;
    }

    setRunSave(run);
    this.playerHpText.setText(`HP ${run.currentHp}/${run.maxHp}`);
    this.backpackPanel?.destroy(true);
    this.backpackPanel = null;
  }

  private showNextQuestion() {
    if (this.questionPool.length === 0) {
      this.questionPool = Phaser.Utils.Array.Shuffle(getQuestions(this)) as WildsQuestion[];
    }
    this.currentQuestion = this.questionPool.shift()!;
    this.logText.setText(this.currentQuestion.prompt);
    this.answerContainers.forEach((container, index) => {
      const label = container.list.find((child) => child instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text;
      label.setText(this.currentQuestion.choices[index]);
    });
  }

  private resolveAnswer(index: number) {
    const run = getRunSave();
    if (!run) return;
    const enemy = creatureById(this, this.sceneData.encounterId);
    const correct = index === this.currentQuestion.correctIndex;
    let enemyHp = Number((this.enemyHpText.text.match(/HP (\d+)/)?.[1] ?? enemy.maxHp));

    if (correct) {
      this.streak += 1;
      const streakBoost = creatureById(this, run.playerCreature).ability === "streak_boost";
      const crit = creatureById(this, run.playerCreature).ability === "fourth_crit" && this.streak % 4 === 0;
      let damage = damageForCorrectAnswer(run.attack, this.streak, enemy.defense, streakBoost, crit);
      if (this.registry.get(REGISTRY_KEYS.playerAttackBuff)) {
        damage = Math.ceil(damage * 1.5);
        this.registry.remove(REGISTRY_KEYS.playerAttackBuff);
      }
      if (creatureById(this, run.playerCreature).ability === "first_strike" && enemyHp === enemy.maxHp) {
        damage = Math.ceil(damage * 1.3);
      }
      enemyHp = Math.max(0, enemyHp - damage);
      this.enemyHpText.setText(`HP ${enemyHp}/${enemy.maxHp}`);
      this.flashHit(this.enemySprite, 0xffd166);
      this.logText.setText(crit ? `Critical hit! ${enemy.name} takes ${damage}.` : `Correct! ${enemy.name} takes ${damage}.`);
    } else {
      const playerCreature = creatureById(this, run.playerCreature);
      this.streak = 0;
      if (playerCreature.ability === "wrong_chip") {
        enemyHp = Math.max(0, enemyHp - 3);
        this.enemyHpText.setText(`HP ${enemyHp}/${enemy.maxHp}`);
        this.logText.setText(`Wrong answer, but Thorn Scratch still clips ${enemy.name} for 3.`);
      } else if (playerCreature.ability === "wrong_chip_plus") {
        enemyHp = Math.max(0, enemyHp - 5);
        this.enemyHpText.setText(`HP ${enemyHp}/${enemy.maxHp}`);
        this.logText.setText(`Wrong answer, but Shadow Bite still lands for 5.`);
      } else {
        this.logText.setText("Wrong answer. The enemy presses forward.");
      }
    }

    if (enemyHp <= 0) {
      this.time.delayedCall(550, () => {
        this.registry.set(REGISTRY_KEYS.lastBattleResult, { perfect: run.currentHp === run.maxHp });
        this.scene.start("CaptureScene", {
          nodeId: this.sceneData.nodeId,
          encounterId: this.sceneData.encounterId,
          isBoss: this.sceneData.isBoss,
          victory: true,
        });
      });
      return;
    }

    const reduced = this.registry.get(REGISTRY_KEYS.playerShieldBuff) ? 0.5 : 1;
    this.registry.remove(REGISTRY_KEYS.playerShieldBuff);
    const enemyDamage = Math.max(1, Math.floor((enemy.attack + (this.sceneData.isBoss ? 2 : 0)) * reduced) - run.defense);
    run.currentHp -= enemyDamage;

    if (creatureById(this, run.playerCreature).ability === "heal_on_correct_streak" && this.streak >= 3 && this.streak % 3 === 0) {
      run.currentHp = Math.min(run.maxHp, run.currentHp + 3);
    }

    if (run.currentHp <= 0 && !run.usedRevive && run.items.some((item) => item.id === "revive_capsule" && item.quantity > 0)) {
      run.usedRevive = true;
      run.currentHp = Math.ceil(run.maxHp * 0.5);
      run.items = run.items.map((item) => item.id === "revive_capsule" ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0);
      this.logText.setText(`Revive Capsule triggers! ${creatureById(this, run.playerCreature).name} gets back up.`);
    } else if (run.currentHp <= 0) {
      clearRunSave();
      this.playerHpText.setText("HP 0/0");
      this.flashHit(this.playerSprite, 0xff6b6b);
      this.time.delayedCall(800, () => {
        this.scene.start("RewardScene", {
          nodeId: this.sceneData.nodeId,
          title: "Defeat",
          summary: `${enemy.name} wins this round. Your run ends here, but your collection survives.`,
          victory: false,
          baseCoins: 0,
        });
      });
      return;
    } else {
      this.flashHit(this.playerSprite, 0xff6b6b);
      this.logText.setText(`${this.logText.text}\n${enemy.name} hits back for ${enemyDamage}.`);
    }

    setRunSave(run);
    this.playerHpText.setText(`HP ${run.currentHp}/${run.maxHp}`);
    this.showNextQuestion();
  }

  private flashHit(target: Phaser.GameObjects.Image, tint: number) {
    target.setTint(tint);
    this.tweens.add({
      targets: target,
      x: target.x + 10,
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => target.clearTint(),
    });
  }
}
