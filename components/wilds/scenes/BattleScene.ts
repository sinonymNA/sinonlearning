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
import type { WildsAudioManager } from "../WildsAudio";
import type { BattleSceneData, WildsQuestion } from "../types";

export class BattleScene extends Phaser.Scene {
  private sceneData!: BattleSceneData;
  private streak = 0;
  private turnCount = 0;
  private enemyCurrentHp = 0;
  private questionPool: WildsQuestion[] = [];
  private currentQuestion!: WildsQuestion;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private answerContainers: Phaser.GameObjects.Container[] = [];
  private backpackPanel: Phaser.GameObjects.Container | null = null;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private streakText!: Phaser.GameObjects.Text;
  private answersLocked = false;

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

    this.cameras.main.fadeIn(220, 8, 18, 31);

    const player = creatureById(this, run.playerCreature);
    const enemy = creatureById(this, this.sceneData.encounterId);
    this.enemyCurrentHp = enemy.maxHp;

    fitBackground(this, "verdant-battle-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x09131f, 0.18);

    this.add.image(360, 96, "battle_hp_player_frame").setDisplaySize(540, 112);
    this.add.image(1560, 96, "battle_hp_enemy_frame").setDisplaySize(540, 112);

    // HP bars
    this.add.rectangle(362, 126, 340, 10, 0x1e3a4a).setOrigin(0.5);
    this.playerHpBar = this.add.rectangle(192, 126, 340, 10, 0x34d399).setOrigin(0, 0.5);
    this.add.rectangle(1558, 126, 340, 10, 0x1e3a4a).setOrigin(0.5);
    this.enemyHpBar = this.add.rectangle(1388, 126, 340, 10, 0xf87171).setOrigin(0, 0.5);

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

    this.streakText = wildsText(this, 960, 970, "", 26, "#fde047").setOrigin(0.5);

    this.questionPool = Phaser.Utils.Array.Shuffle(getQuestions(this)) as WildsQuestion[];
    this.createAnswerButtons();
    this.createBackpack();

    // shield_start: give player a shield at battle start
    if (player.ability === "shield_start") {
      this.registry.set(REGISTRY_KEYS.playerShieldBuff, 0.5);
    }

    if (this.sceneData.isBoss) {
      this.playBossIntro(enemy.name, () => this.showNextQuestion());
    } else {
      this.showNextQuestion();
    }
  }

  private playBossIntro(name: string, onDone: () => void) {
    const audio = this.registry.get(REGISTRY_KEYS.wildsAudio) as WildsAudioManager | undefined;
    audio?.play("boss-appear");

    this.tweens.add({
      targets: this.enemySprite,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 600,
      yoyo: true,
    });

    const flash = wildsText(this, 960, 540, name.toUpperCase(), 72, "#fda4af", { align: "center" }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      hold: 600,
      onComplete: () => {
        flash.destroy();
        onDone();
      },
    });
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
      hitbox.on("pointerover", () => { if (!this.answersLocked) container.setScale(1.02); });
      hitbox.on("pointerout", () => container.setScale(1));
      hitbox.on("pointerdown", () => { if (!this.answersLocked) container.setScale(0.97); });
      hitbox.on("pointerup", () => {
        if (this.answersLocked) return;
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

    const audio = this.registry.get(REGISTRY_KEYS.wildsAudio) as WildsAudioManager | undefined;
    audio?.play("item-use");

    item.quantity -= 1;
    if (item.quantity <= 0) {
      run.items = run.items.filter((entry) => entry.quantity > 0);
    }

    switch (itemId) {
      case "heal_capsule":
        run.currentHp = Math.min(run.maxHp, run.currentHp + 25);
        this.logText.setText("Heal Capsule restores 25 HP.");
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, "+25 HP", "#6ee7b7");
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
    this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, creatureById(this, this.sceneData.encounterId).maxHp);
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
      const img = container.list.find((child) => child instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
      img.clearTint();
      container.setScale(1);
    });
    this.answersLocked = false;
  }

  private resolveAnswer(index: number) {
    const run = getRunSave();
    if (!run) return;

    this.answersLocked = true;
    this.turnCount += 1;

    const enemy = creatureById(this, this.sceneData.encounterId);
    const playerCreature = creatureById(this, run.playerCreature);
    const correct = index === this.currentQuestion.correctIndex;
    const audio = this.registry.get(REGISTRY_KEYS.wildsAudio) as WildsAudioManager | undefined;

    if (correct) {
      audio?.play("correct");
      this.streak += 1;
      if (this.streak >= 3 && this.streak % 3 === 0) {
        audio?.play("streak");
      }

      const streakBoost = playerCreature.ability === "streak_boost";
      const crit = playerCreature.ability === "fourth_crit" && this.streak % 4 === 0;
      let damage = damageForCorrectAnswer(run.attack, this.streak, enemy.defense, streakBoost, crit);

      if (this.registry.get(REGISTRY_KEYS.playerAttackBuff)) {
        damage = Math.ceil(damage * 1.5);
        this.registry.remove(REGISTRY_KEYS.playerAttackBuff);
      }
      if (playerCreature.ability === "first_strike" && this.enemyCurrentHp === enemy.maxHp) {
        damage = Math.ceil(damage * 1.3);
      }

      // boss_guardian: absorb if enemy shield is active
      if (this.registry.get(REGISTRY_KEYS.enemyShieldActive)) {
        this.registry.remove(REGISTRY_KEYS.enemyShieldActive);
        this.logText.setText("Your attack was absorbed by the guardian shield!");
        this.floatText(this.enemySprite.x, this.enemySprite.y - 80, "BLOCKED", "#c4b5fd");
      } else {
        this.enemyCurrentHp = Math.max(0, this.enemyCurrentHp - damage);
        this.enemyHpText.setText(`HP ${this.enemyCurrentHp}/${enemy.maxHp}`);
        this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, enemy.maxHp);
        this.flashHit(this.enemySprite, 0xffd166);
        audio?.play("hit");
        this.floatText(this.enemySprite.x, this.enemySprite.y - 80, `-${damage}`, "#ffd166");
        this.logText.setText(crit ? `Critical hit! ${enemy.name} takes ${damage}.` : `Correct! ${enemy.name} takes ${damage}.`);
      }

      // heal_on_correct_streak
      if (playerCreature.ability === "heal_on_correct_streak" && this.streak >= 3 && this.streak % 3 === 0) {
        run.currentHp = Math.min(run.maxHp, run.currentHp + 3);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, "+3 HP", "#6ee7b7");
      }

    } else {
      audio?.play("wrong");
      this.streak = 0;

      // chip abilities on wrong answer
      if (playerCreature.ability === "wrong_chip") {
        this.enemyCurrentHp = Math.max(0, this.enemyCurrentHp - 3);
        this.enemyHpText.setText(`HP ${this.enemyCurrentHp}/${enemy.maxHp}`);
        this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, enemy.maxHp);
        this.floatText(this.enemySprite.x, this.enemySprite.y - 80, "-3", "#c4b5fd");
        this.logText.setText(`Wrong answer, but Thorn Scratch still clips ${enemy.name} for 3.`);
      } else if (playerCreature.ability === "wrong_chip_plus") {
        this.enemyCurrentHp = Math.max(0, this.enemyCurrentHp - 5);
        this.enemyHpText.setText(`HP ${this.enemyCurrentHp}/${enemy.maxHp}`);
        this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, enemy.maxHp);
        this.floatText(this.enemySprite.x, this.enemySprite.y - 80, "-5", "#c4b5fd");
        this.logText.setText(`Wrong answer, but Shadow Bite still lands for 5.`);
      } else {
        this.logText.setText(this.currentQuestion.explanation
          ? `Wrong. ${this.currentQuestion.explanation}`
          : "Wrong answer. The enemy presses forward.");
      }

      // reveal correct answer for 1.1s
      this.answerContainers.forEach((c, i) => {
        if (i === this.currentQuestion.correctIndex) {
          c.setScale(1.08);
          const img = c.list.find((child) => child instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
          img.setTint(0x6ee7b7);
        }
      });
    }

    // boss_guardian: raise shield on every 3rd turn
    if (this.sceneData.isBoss && this.turnCount % 3 === 0 && this.enemyCurrentHp > 0) {
      this.registry.set(REGISTRY_KEYS.enemyShieldActive, true);
      const currentLog = this.logText.text;
      this.time.delayedCall(correct ? 0 : 0, () => {
        if (correct) {
          this.logText.setText(`${currentLog}\nThe Warden Wisp raises a guardian shield!`);
        } else {
          this.logText.setText(`${this.logText.text}\nThe Warden Wisp raises a guardian shield!`);
        }
      });
    }

    if (this.enemyCurrentHp <= 0) {
      // post-victory heals
      if (playerCreature.ability === "post_battle_heal") {
        run.currentHp = Math.min(run.maxHp, run.currentHp + 8);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, "+8 HP", "#6ee7b7");
      } else if (playerCreature.ability === "victory_heal_big") {
        run.currentHp = Math.min(run.maxHp, run.currentHp + 15);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, "+15 HP", "#6ee7b7");
      }
      setRunSave(run);

      const doTransition = () => {
        this.registry.set(REGISTRY_KEYS.lastBattleResult, { perfect: run.currentHp === run.maxHp });
        if (this.sceneData.isBoss) {
          // boss defeat sequence
          this.tweens.add({ targets: this.enemySprite, scaleX: 0, scaleY: 0, alpha: 0, duration: 600, ease: "Quad.easeIn" });
          const bossDefeatedText = wildsText(this, 960, 540, "BOSS DEFEATED!", 72, "#fda4af").setOrigin(0.5).setDepth(10).setAlpha(0);
          this.tweens.add({ targets: bossDefeatedText, alpha: 1, duration: 400 });
          this.cameras.main.flash(300, 255, 255, 255, false);
          this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(280, 8, 18, 31);
            this.time.delayedCall(280, () => {
              this.scene.start("CaptureScene", {
                nodeId: this.sceneData.nodeId,
                encounterId: this.sceneData.encounterId,
                isBoss: this.sceneData.isBoss,
                victory: true,
              });
            });
          });
        } else {
          audio?.play("victory");
          this.cameras.main.fadeOut(280, 8, 18, 31);
          this.time.delayedCall(280, () => {
            this.scene.start("CaptureScene", {
              nodeId: this.sceneData.nodeId,
              encounterId: this.sceneData.encounterId,
              isBoss: this.sceneData.isBoss,
              victory: true,
            });
          });
        }
      };

      this.time.delayedCall(correct ? 550 : 1200, doTransition);
      return;
    }

    // update streak display
    this.streakText.setText(this.streak >= 2 ? `${this.streak} streak` : "");

    if (!correct) {
      // enemy retaliation only on wrong answers
      const reduced = this.registry.get(REGISTRY_KEYS.playerShieldBuff) ? 0.5 : 1;
      this.registry.remove(REGISTRY_KEYS.playerShieldBuff);
      const enemyDamage = Math.max(1, Math.floor((enemy.attack + (this.sceneData.isBoss ? 2 : 0)) * reduced) - run.defense);
      run.currentHp -= enemyDamage;
      audio?.play("player-hit");

      if (run.currentHp <= 0 && !run.usedRevive && run.items.some((item) => item.id === "revive_capsule" && item.quantity > 0)) {
        run.usedRevive = true;
        run.currentHp = Math.ceil(run.maxHp * 0.5);
        run.items = run.items.map((item) => item.id === "revive_capsule" ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0);
        this.logText.setText(`Revive Capsule triggers! ${playerCreature.name} gets back up.`);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, `-${enemyDamage}`, "#ff6b6b");
      } else if (run.currentHp <= 0) {
        clearRunSave();
        this.playerHpText.setText("HP 0/0");
        this.flashHit(this.playerSprite, 0xff6b6b);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, `-${enemyDamage}`, "#ff6b6b");
        audio?.play("defeat");
        this.time.delayedCall(1200, () => {
          this.cameras.main.fadeOut(280, 8, 18, 31);
          this.time.delayedCall(280, () => {
            this.scene.start("RewardScene", {
              nodeId: this.sceneData.nodeId,
              title: "Defeat",
              summary: `${enemy.name} wins this round. Your run ends here, but your collection survives.`,
              victory: false,
              baseCoins: 0,
            });
          });
        });
        return;
      } else {
        this.flashHit(this.playerSprite, 0xff6b6b);
        this.floatText(this.playerSprite.x, this.playerSprite.y - 80, `-${enemyDamage}`, "#ff6b6b");
        this.logText.setText(`${this.logText.text}\n${enemy.name} hits back for ${enemyDamage}.`);
      }

      setRunSave(run);
      this.playerHpText.setText(`HP ${run.currentHp}/${run.maxHp}`);
      this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, enemy.maxHp);

      // delay next question to let answer reveal play out
      this.time.delayedCall(1150, () => {
        this.answerContainers.forEach((c) => {
          c.setScale(1);
          const img = c.list.find((child) => child instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
          img.clearTint();
        });
        this.showNextQuestion();
      });
    } else {
      setRunSave(run);
      this.playerHpText.setText(`HP ${run.currentHp}/${run.maxHp}`);
      this.updateHpBars(run.currentHp, run.maxHp, this.enemyCurrentHp, enemy.maxHp);
      this.showNextQuestion();
    }
  }

  private updateHpBars(playerHp: number, playerMax: number, enemyHp: number, enemyMax: number) {
    this.playerHpBar.scaleX = Math.max(0, playerHp / playerMax);
    this.enemyHpBar.scaleX = Math.max(0, enemyHp / enemyMax);
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const t = wildsText(this, x, y, text, 30, color);
    t.setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 850,
      ease: "Quad.easeOut",
      onComplete: () => t.destroy(),
    });
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
