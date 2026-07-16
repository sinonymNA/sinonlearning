import Phaser from "phaser";
import type { GameState } from "../GameState";
import type { BoardScene } from "./BoardScene";
import type { UIScene } from "./UIScene";

const ROUND_SECONDS = 22;

interface Breaker {
  id: string;
  name: string;
  isBot: boolean;
  sprite: Phaser.Physics.Arcade.Sprite;
  label: Phaser.GameObjects.Text;
  score: number;
  cooldown: number;
}

interface PrizeCrate {
  id: number;
  body: Phaser.GameObjects.Container;
  hitbox: Phaser.GameObjects.Rectangle;
  hp: number;
  value: number;
  rare: boolean;
}

export class CrateBreakScene extends Phaser.Scene {
  private gameState!: GameState;
  private ui!: UIScene;
  private breakers: Breaker[] = [];
  private crates: PrizeCrate[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private active = false;
  private nextCrateId = 0;
  private pointerTarget: Phaser.Math.Vector2 | null = null;

  constructor() {
    super({ key: "CrateBreakScene" });
  }

  init(data: { state: GameState }) {
    this.gameState = data.state;
    this.breakers = [];
    this.crates = [];
    this.active = false;
    this.nextCrateId = 0;
    this.pointerTarget = null;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, 0x080526, 0.76).setOrigin(0);
    this.add.text(W / 2, 18, "CRATE BREAK", {
      fontSize: "25px", fontFamily: "sans-serif", color: "#c4a7ff", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(W / 2, 48, "Move close and press SPACE â€” or tap a nearby crate.", {
      fontSize: "11px", fontFamily: "sans-serif", color: "#ffffff",
    }).setOrigin(0.5);

    this.physics.world.setBounds(8, 62, W - 16, H - 120);
    this.ui = this.scene.get("UIScene") as UIScene;
    this.scene.bringToTop("UIScene");
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey("W"), down: this.input.keyboard!.addKey("S"),
      left: this.input.keyboard!.addKey("A"), right: this.input.keyboard!.addKey("D"),
    };
    this.actionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const human = this.breakers.find((breaker) => !breaker.isBot);
      const crate = this.nearestCrate(pointer.x, pointer.y);
      if (human && crate && Phaser.Math.Distance.Between(pointer.x, pointer.y, crate.body.x, crate.body.y) < 48
        && Phaser.Math.Distance.Between(human.sprite.x, human.sprite.y, crate.body.x, crate.body.y) < 74) {
        this.hitCrate(human, crate);
      } else this.pointerTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    const starts = [{ x: 90, y: 365 }, { x: 710, y: 365 }, { x: 90, y: 95 }, { x: 710, y: 95 }];
    this.gameState.players.forEach((player, index) => {
      const capId = player.capId.replace(/^cap-/, "");
      const preferred = `cap-char-${capId}-${player.colorIndex}`;
      const texture = this.textures.exists(preferred) ? preferred : `player-${player.colorIndex}`;
      const sprite = this.physics.add.sprite(starts[index].x, starts[index].y, texture).setCollideWorldBounds(true).setDepth(12);
      const label = this.add.text(sprite.x, sprite.y - 29, player.displayName.slice(0, 9), {
        fontSize: "9px", color: "#ffffff", backgroundColor: "#07142faa",
      }).setOrigin(0.5).setDepth(13);
      const breaker: Breaker = { id: player.id, name: player.displayName, isBot: player.isBot, sprite, label, score: 0, cooldown: 0 };
      for (const other of this.breakers) this.physics.add.collider(sprite, other.sprite);
      this.breakers.push(breaker);
    });

    for (let index = 0; index < 12; index++) this.spawnCrate();
    this.ui.showMinigameTimer(ROUND_SECONDS);
    this.showCountdown(() => {
      this.active = true;
      this.time.delayedCall(ROUND_SECONDS * 1000, () => this.finishRound());
    });
  }

  update(_time: number, delta: number) {
    if (!this.active) return;
    const human = this.breakers.find((breaker) => !breaker.isBot);
    if (human) {
      let x = 0;
      let y = 0;
      if (this.cursors.left.isDown || this.wasd.left.isDown) x--;
      if (this.cursors.right.isDown || this.wasd.right.isDown) x++;
      if (this.cursors.up.isDown || this.wasd.up.isDown) y--;
      if (this.cursors.down.isDown || this.wasd.down.isDown) y++;
      if (x || y) {
        this.pointerTarget = null;
        const velocity = new Phaser.Math.Vector2(x, y).normalize().scale(205);
        human.sprite.setVelocity(velocity.x, velocity.y);
      } else if (this.pointerTarget) {
        if (Phaser.Math.Distance.Between(human.sprite.x, human.sprite.y, this.pointerTarget.x, this.pointerTarget.y) < 10) {
          human.sprite.setVelocity(0);
        } else this.physics.moveToObject(human.sprite, this.pointerTarget, 205);
      } else human.sprite.setVelocity(0);
      human.cooldown = Math.max(0, human.cooldown - delta);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
        const crate = this.nearestCrate(human.sprite.x, human.sprite.y);
        if (crate) this.hitCrate(human, crate);
      }
    }

    for (const bot of this.breakers.filter((breaker) => breaker.isBot)) {
      bot.cooldown = Math.max(0, bot.cooldown - delta);
      const crate = this.crates.slice().sort((a, b) => {
        const scoreA = a.value * 80 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, a.body.x, a.body.y);
        const scoreB = b.value * 80 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, b.body.x, b.body.y);
        return scoreB - scoreA;
      })[0];
      if (!crate) continue;
      const distance = Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, crate.body.x, crate.body.y);
      if (distance > 58) this.physics.moveToObject(bot.sprite, crate.body, 145);
      else {
        bot.sprite.setVelocity(0);
        if (bot.cooldown <= 0) this.hitCrate(bot, crate);
      }
    }
    this.breakers.forEach((breaker) => breaker.label.setPosition(breaker.sprite.x, breaker.sprite.y - 29));
  }

  private spawnCrate() {
    const rare = Math.random() < 0.18;
    const x = Phaser.Math.Between(90, 710);
    const y = Phaser.Math.Between(100, 340);
    const hitbox = this.add.rectangle(0, 0, rare ? 58 : 50, rare ? 58 : 50, rare ? 0xffc857 : 0x5b3fb2, 1)
      .setStrokeStyle(4, 0x07142f);
    const crossA = this.add.rectangle(0, 0, rare ? 52 : 44, 6, 0xffd166).setAngle(45);
    const crossB = this.add.rectangle(0, 0, rare ? 52 : 44, 6, 0xffd166).setAngle(-45);
    const badge = this.add.image(0, 0, rare ? "grand-cap-art" : "space-capsule-art").setDisplaySize(28, 28);
    const body = this.add.container(x, y, [hitbox, crossA, crossB, badge]).setDepth(7);
    const crate: PrizeCrate = { id: this.nextCrateId++, body, hitbox, hp: rare ? 3 : 2, value: rare ? 4 : 2, rare };
    this.crates.push(crate);
    this.tweens.add({ targets: body, scaleX: { from: 0, to: 1 }, scaleY: { from: 0, to: 1 }, duration: 220, ease: "Back.Out" });
  }

  private nearestCrate(x: number, y: number) {
    return this.crates.slice().sort((a, b) => Phaser.Math.Distance.Between(x, y, a.body.x, a.body.y)
      - Phaser.Math.Distance.Between(x, y, b.body.x, b.body.y))[0];
  }

  private hitCrate(breaker: Breaker, crate: PrizeCrate) {
    if (!this.active || breaker.cooldown > 0) return;
    if (Phaser.Math.Distance.Between(breaker.sprite.x, breaker.sprite.y, crate.body.x, crate.body.y) > 74) return;
    breaker.cooldown = 420;
    crate.hp--;
    this.tweens.add({ targets: crate.body, x: crate.body.x + Phaser.Math.Between(-7, 7), duration: 55, yoyo: true, repeat: 2 });
    const burst = this.add.image(crate.body.x, crate.body.y, "space-raid-art").setDisplaySize(42, 42).setDepth(15);
    this.tweens.add({ targets: burst, scale: 1.7, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
    if (crate.hp > 0) return;
    breaker.score += crate.value;
    const scoreText = this.add.text(crate.body.x, crate.body.y, `+${crate.value}`, {
      fontSize: "18px", color: crate.rare ? "#ffd166" : "#c4a7ff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: scoreText, y: scoreText.y - 35, alpha: 0, duration: 650, onComplete: () => scoreText.destroy() });
    crate.body.destroy();
    this.crates = this.crates.filter((candidate) => candidate.id !== crate.id);
    this.time.delayedCall(250, () => this.spawnCrate());
  }

  private showCountdown(done: () => void) {
    let count = 3;
    const tick = () => {
      if (!count) { done(); return; }
      const text = this.add.text(400, 225, `${count}`, {
        fontSize: "86px", color: "#c4a7ff", fontStyle: "bold", stroke: "#07142f", strokeThickness: 8,
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({ targets: text, scale: 1.4, alpha: 0, duration: 700, onComplete: () => { text.destroy(); count--; tick(); } });
    };
    tick();
  }

  private finishRound() {
    if (!this.active) return;
    this.active = false;
    this.ui.hideMinigameTimer();
    this.breakers.forEach((breaker) => breaker.sprite.setVelocity(0));
    const ranked = [...this.breakers].sort((a, b) => b.score - a.score);
    const rewards = [8, 5, 3, 1];
    this.add.rectangle(400, 225, 430, 270, 0x07142f, 0.97).setStrokeStyle(4, 0xc4a7ff).setDepth(90);
    this.add.text(400, 115, "CRATE RESULTS", { fontSize: "24px", color: "#c4a7ff", fontStyle: "bold" }).setOrigin(0.5).setDepth(91);
    ranked.forEach((breaker, index) => this.add.text(250, 155 + index * 38, `${index + 1}. ${breaker.name}   ${breaker.score}`, {
      fontSize: "16px", color: "#ffffff",
    }).setDepth(91));
    const continueText = this.add.text(400, 330, "CONTINUE", {
      fontSize: "15px", color: "#07142f", backgroundColor: "#c4a7ff", padding: { x: 22, y: 9 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });
    let completed = false;
    const leave = () => {
      if (completed) return;
      completed = true;
      this.scene.stop();
      const board = this.scene.get("BoardScene") as BoardScene;
      board.onMinigameComplete(ranked.map((breaker, index) => ({ playerId: breaker.id, coins: rewards[index] })));
    };
    continueText.on("pointerdown", leave);
    this.time.delayedCall(3200, leave);
  }
}

