import Phaser from "phaser";
import type { GameState } from "../GameState";
import type { BoardScene } from "./BoardScene";
import type { UIScene } from "./UIScene";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";

const ROUND_SECONDS = 22;
const HUMAN_SPEED = 220;

interface FactoryActor {
  id: string;
  name: string;
  isBot: boolean;
  sprite: Phaser.Physics.Arcade.Sprite;
  label: Phaser.GameObjects.Text;
  score: number;
}

interface FallingPart {
  sprite: Phaser.Physics.Arcade.Sprite;
  harmful: boolean;
  value: number;
}

export class FactoryFloorScene extends Phaser.Scene {
  private gameState!: GameState;
  private ui!: UIScene;
  private actors: FactoryActor[] = [];
  private parts: FallingPart[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private active = false;
  private pointerTarget: Phaser.Math.Vector2 | null = null;

  constructor() {
    super({ key: "FactoryFloorScene" });
  }

  init(data: { state: GameState }) {
    this.gameState = data.state;
    this.actors = [];
    this.parts = [];
    this.active = false;
    this.pointerTarget = null;
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    this.add.image(W / 2, H / 2, "factory-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, 0x061027, 0.45).setOrigin(0);
    this.add.text(W / 2, 18, "FACTORY FLOOR", {
      fontSize: "24px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(W / 2, 46, "Collect capsules. Dodge red traps.", {
      fontSize: "11px", fontFamily: "sans-serif", color: "#ffffff",
    }).setOrigin(0.5);

    this.physics.world.setBounds(8, 60, W - 16, H - 118);
    this.ui = this.scene.get("UIScene") as UIScene;
    this.scene.bringToTop("UIScene");
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey("W"), down: this.input.keyboard!.addKey("S"),
      left: this.input.keyboard!.addKey("A"), right: this.input.keyboard!.addKey("D"),
    };
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.pointerTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    const starts = [120, 305, 495, 680];
    this.gameState.players.forEach((player, index) => {
      const capId = player.capId.replace(/^cap-/, "");
      const preferred = `cap-char-${capId}-${player.colorIndex}`;
      const texture = this.textures.exists(preferred) ? preferred : `player-${player.colorIndex}`;
      const sprite = this.physics.add.sprite(starts[index], H - 92, texture).setCollideWorldBounds(true).setDepth(10);
      sprite.setDisplaySize(40, 40);
      sprite.setCircle(18);
      const label = this.add.text(sprite.x, sprite.y - 30, player.displayName.slice(0, 9), {
        fontSize: "9px", fontFamily: "sans-serif", color: "#ffffff", backgroundColor: "#07142faa",
      }).setOrigin(0.5).setDepth(11);
      const actor: FactoryActor = { id: player.id, name: player.displayName, isBot: player.isBot, sprite, label, score: 0 };
      for (const other of this.actors) this.physics.add.collider(sprite, other.sprite);
      this.actors.push(actor);
    });

    this.ui.showMinigameIntro({
      title: "Factory Frenzy",
      kicker: "Catch-and-dodge challenge",
      objective: "Catch falling capsules. Stay away from the red traps.",
      controls: "ARROWS / WASD to move  •  TAP to dash there",
      tip: "Rare gold capsules are worth three points.",
      accent: 0xffd166,
    }, () => this.showCountdown(() => {
      this.ui.showMinigameTimer(ROUND_SECONDS);
      this.active = true;
      this.time.addEvent({ delay: 620, loop: true, callback: () => this.spawnPart() });
      this.time.delayedCall(ROUND_SECONDS * 1000, () => this.finishRound());
    }));
  }

  update() {
    if (!this.active) return;
    const human = this.actors.find((actor) => !actor.isBot);
    if (human) {
      let x = 0;
      let y = 0;
      if (this.cursors.left.isDown || this.wasd.left.isDown) x--;
      if (this.cursors.right.isDown || this.wasd.right.isDown) x++;
      if (this.cursors.up.isDown || this.wasd.up.isDown) y--;
      if (this.cursors.down.isDown || this.wasd.down.isDown) y++;
      if (x || y) {
        this.pointerTarget = null;
        const vector = new Phaser.Math.Vector2(x, y).normalize().scale(HUMAN_SPEED);
        human.sprite.setVelocity(vector.x, vector.y);
      } else if (this.pointerTarget) {
        const distance = Phaser.Math.Distance.Between(human.sprite.x, human.sprite.y, this.pointerTarget.x, this.pointerTarget.y);
        if (distance < 10) human.sprite.setVelocity(0);
        else this.physics.moveToObject(human.sprite, this.pointerTarget, HUMAN_SPEED);
      } else human.sprite.setVelocity(0);
    }

    for (const bot of this.actors.filter((actor) => actor.isBot)) {
      const target = this.parts.filter((part) => !part.harmful)
        .sort((a, b) => Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, a.sprite.x, a.sprite.y)
          - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, b.sprite.x, b.sprite.y))[0];
      if (target) this.physics.moveToObject(bot.sprite, target.sprite, 78);
    }

    for (const actor of this.actors) {
      actor.label.setPosition(actor.sprite.x, actor.sprite.y - 30);
      for (let index = this.parts.length - 1; index >= 0; index--) {
        const part = this.parts[index];
        if (Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, part.sprite.x, part.sprite.y) < 31) {
          actor.score = Math.max(0, actor.score + part.value);
          this.floatScore(actor.sprite.x, actor.sprite.y, part.value);
          if (part.harmful) actor.sprite.setVelocityY(170);
          part.sprite.destroy();
          this.parts.splice(index, 1);
        }
      }
    }
    this.parts = this.parts.filter((part) => {
      if (part.sprite.y < PARTY_HEIGHT - 56) return true;
      part.sprite.destroy();
      return false;
    });
  }

  private spawnPart() {
    if (!this.active) return;
    const harmful = Math.random() < 0.3;
    const texture = harmful ? "space-trap-art" : Math.random() < 0.16 ? "grand-cap-art" : "space-capsule-art";
    const value = harmful ? -2 : texture === "grand-cap-art" ? 3 : 1;
    const sprite = this.physics.add.sprite(Phaser.Math.Between(35, 765), 68, texture).setDisplaySize(34, 34).setDepth(8);
    sprite.setVelocityY(Phaser.Math.Between(95, 150));
    this.parts.push({ sprite, harmful, value });
  }

  private floatScore(x: number, y: number, value: number) {
    const text = this.add.text(x, y - 18, value > 0 ? `+${value}` : `${value}`, {
      fontSize: "16px", fontFamily: "sans-serif", color: value > 0 ? "#ffd166" : "#ff5d73", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: text, y: y - 45, alpha: 0, duration: 650, onComplete: () => text.destroy() });
  }

  private showCountdown(done: () => void) {
    let count = 3;
    const tick = () => {
      if (count === 0) { done(); return; }
      const text = this.add.text(400, 225, `${count}`, {
        fontSize: "86px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold",
        stroke: "#07142f", strokeThickness: 8,
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({ targets: text, scale: 1.4, alpha: 0, duration: 700, onComplete: () => { text.destroy(); count--; tick(); } });
    };
    tick();
  }

  private finishRound() {
    if (!this.active) return;
    this.active = false;
    this.ui.hideMinigameTimer();
    this.actors.forEach((actor) => actor.sprite.setVelocity(0));
    const ranked = [...this.actors].sort((a, b) => b.score - a.score);
    const rewards = [8, 5, 3, 1];
    const panel = this.add.rectangle(400, 225, 430, 270, 0x07142f, 0.97).setStrokeStyle(4, 0xffd166).setDepth(90);
    this.add.text(400, 115, "FACTORY RESULTS", { fontSize: "24px", color: "#ffd166", fontStyle: "bold" }).setOrigin(0.5).setDepth(91);
    ranked.forEach((actor, index) => this.add.text(250, 155 + index * 38, `${index + 1}. ${actor.name}   ${actor.score}`, {
      fontSize: "16px", color: "#ffffff",
    }).setDepth(91));
    const continueText = this.add.text(400, 330, "CONTINUE", {
      fontSize: "15px", color: "#07142f", backgroundColor: "#ffd166", padding: { x: 22, y: 9 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });
    let completed = false;
    const leave = () => {
      if (completed) return;
      completed = true;
      panel.destroy();
      this.scene.stop();
      const board = this.scene.get("BoardScene") as BoardScene;
      board.onMinigameComplete(ranked.map((actor, index) => ({ playerId: actor.id, coins: rewards[index] })));
    };
    continueText.setVisible(false).disableInteractive();
    this.ui.showMinigameResults("Factory Frenzy", 0xffd166, ranked.map((actor) => ({
      name: actor.name,
      score: actor.score,
    })), leave);
  }
}

