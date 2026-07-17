import Phaser from "phaser";
import type { GameState } from "../GameState";
import type { BoardScene } from "./BoardScene";
import type { UIScene } from "./UIScene";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import type { AudioManager } from "../AudioManager";

const ROUND_SECONDS = 22;
const HUMAN_SPEED = 220;
const BOT_SPEED = 140;
const BOT_MISS_CHANCE = 0.2; // 20% chance bot near part still misses

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
  isGolden?: boolean;
}

export class FactoryFloorScene extends Phaser.Scene {
  private gameState!: GameState;
  private ui!: UIScene;
  private audio: AudioManager | null = null;
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

    // Conveyor lane overlays — left (blue bias), center (neutral), right (red bias)
    this.add.rectangle(0, 60, W / 3, H - 60, 0x3b82f6, 0.07).setOrigin(0).setDepth(1);
    this.add.rectangle(2 * W / 3, 60, W / 3, H - 60, 0xef4444, 0.07).setOrigin(0).setDepth(1);
    // Lane dividers
    this.add.rectangle(W / 3, 60, 2, H - 60, 0x334155, 0.5).setOrigin(0).setDepth(1);
    this.add.rectangle(2 * W / 3, 60, 2, H - 60, 0x334155, 0.5).setOrigin(0).setDepth(1);
    // Lane arrow labels
    this.add.text(W / 6, 70, "← DRIFT", { fontSize: "9px", color: "#60a5fa", fontFamily: "sans-serif" }).setOrigin(0.5).setAlpha(0.7).setDepth(2);
    this.add.text(5 * W / 6, 70, "DRIFT →", { fontSize: "9px", color: "#f87171", fontFamily: "sans-serif" }).setOrigin(0.5).setAlpha(0.7).setDepth(2);

    this.add.text(W / 2, 18, "FACTORY FLOOR", {
      fontSize: "24px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);
    this.add.text(W / 2, 46, "Collect capsules. Dodge red traps.", {
      fontSize: "11px", fontFamily: "sans-serif", color: "#ffffff",
    }).setOrigin(0.5).setDepth(3);

    this.physics.world.setBounds(8, 60, W - 16, H - 118);
    this.ui = this.scene.get("UIScene") as UIScene;
    this.audio = this.registry.get("audio") as AudioManager | null;
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
      tip: "Blue lane drifts left, red lane drifts right. Golden capsules are worth 5!",
      accent: 0xffd166,
    }, () => this.showCountdown(() => {
      this.ui.showMinigameTimer(ROUND_SECONDS);
      this.active = true;
      this.time.addEvent({ delay: 620, loop: true, callback: () => this.spawnPart() });
      // Golden capsule event every 9s
      this.time.addEvent({ delay: 9000, loop: true, callback: () => this.spawnGoldenCapsule() });
      // Trap wave event every 13s
      this.time.addEvent({ delay: 13000, loop: true, callback: () => this.spawnTrapWave() });
      this.time.delayedCall(ROUND_SECONDS * 1000, () => this.finishRound());
    }));
  }

  update() {
    if (!this.active) return;
    const W = PARTY_WIDTH;
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

      // Conveyor lane drift
      const conveyorX = this.getConveyorBias(human.sprite.x, W);
      if (conveyorX !== 0) {
        human.sprite.setVelocityX((human.sprite.body as Phaser.Physics.Arcade.Body).velocity.x + conveyorX);
      }
    }

    for (const bot of this.actors.filter((actor) => actor.isBot)) {
      // Prioritize golden capsules, then normal, avoid harmful
      const target = this.parts
        .filter((part) => !part.harmful)
        .sort((a, b) => {
          const valA = (a.isGolden ? 3 : 1) * 100 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, a.sprite.x, a.sprite.y);
          const valB = (b.isGolden ? 3 : 1) * 100 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, b.sprite.x, b.sprite.y);
          return valB - valA;
        })[0];
      if (target) this.physics.moveToObject(bot.sprite, target.sprite, BOT_SPEED);
    }

    for (const actor of this.actors) {
      actor.label.setPosition(actor.sprite.x, actor.sprite.y - 30);
      for (let index = this.parts.length - 1; index >= 0; index--) {
        const part = this.parts[index];
        const dist = Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, part.sprite.x, part.sprite.y);
        if (dist < 31) {
          // Bot miss chance: if bot is near a beneficial part, 20% chance it fails to catch
          if (actor.isBot && !part.harmful && Math.random() < BOT_MISS_CHANCE) continue;
          actor.score = Math.max(0, actor.score + part.value);
          this.floatScore(actor.sprite.x, actor.sprite.y, part.value);
          if (part.isGolden) this.audio?.play("item-use");
          else if (!part.harmful) this.audio?.play("coin");
          else this.audio?.play("trap");
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

  private getConveyorBias(x: number, W: number): number {
    if (x < W / 3) return -30;
    if (x > 2 * W / 3) return 30;
    return 0;
  }

  private spawnPart() {
    if (!this.active) return;
    const W = PARTY_WIDTH;
    const harmful = Math.random() < 0.3;
    const texture = harmful ? "space-trap-art" : Math.random() < 0.16 ? "grand-cap-art" : "space-capsule-art";
    const value = harmful ? -2 : texture === "grand-cap-art" ? 3 : 1;
    const sprite = this.physics.add.sprite(Phaser.Math.Between(35, W - 35), 68, texture).setDisplaySize(34, 34).setDepth(8);
    sprite.setVelocityY(Phaser.Math.Between(95, 150));
    this.parts.push({ sprite, harmful, value });
  }

  private spawnGoldenCapsule() {
    if (!this.active) return;
    const W = PARTY_WIDTH;
    const sprite = this.physics.add.sprite(W / 2, 68, "reward-capsule").setDisplaySize(40, 40).setDepth(9).setTint(0xffd700);
    sprite.setVelocityY(Phaser.Math.Between(80, 120));
    this.parts.push({ sprite, harmful: false, value: 5, isGolden: true });
    this.tweens.add({ targets: sprite, tint: 0xffffff, duration: 160, yoyo: true, repeat: 5 });
  }

  private spawnTrapWave() {
    if (!this.active) return;
    const W = PARTY_WIDTH;
    this.audio?.play("trap");
    for (let i = 0; i < 5; i++) {
      const x = 60 + (i * (W - 120)) / 4;
      const sprite = this.physics.add.sprite(x, 68, "space-trap-art").setDisplaySize(34, 34).setDepth(8);
      sprite.setVelocityY(Phaser.Math.Between(110, 165));
      this.parts.push({ sprite, harmful: true, value: -2 });
    }
  }

  private floatScore(x: number, y: number, value: number) {
    const text = this.add.text(x, y - 18, value > 0 ? `+${value}` : `${value}`, {
      fontSize: "16px", fontFamily: "sans-serif", color: value > 0 ? "#ffd166" : "#ff5d73", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: text, y: y - 45, alpha: 0, duration: 650, onComplete: () => text.destroy() });
  }

  private showCountdown(done: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    let count = 3;
    const tick = () => {
      if (count === 0) { done(); return; }
      this.audio?.play("countdown");
      const text = this.add.text(W / 2, H / 2, `${count}`, {
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
    this.audio?.play("minigame-win");
    const leave = () => {
      this.scene.stop();
      const board = this.scene.get("BoardScene") as BoardScene;
      board.onMinigameComplete(ranked.map((actor, index) => ({ playerId: actor.id, coins: rewards[index] ?? 1 })));
    };
    this.ui.showMinigameResults("Factory Frenzy", 0xffd166, ranked.map((actor) => ({
      name: actor.name,
      score: actor.score,
    })), leave);
  }
}
