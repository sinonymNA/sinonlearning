import Phaser from "phaser";
import type { GameState } from "../GameState";
import type { BoardScene } from "./BoardScene";
import type { UIScene } from "./UIScene";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import type { AudioManager } from "../AudioManager";

const ROUND_SECONDS = 22;
const BOT_SPEED = 130;

interface Breaker {
  id: string;
  name: string;
  isBot: boolean;
  sprite: Phaser.Physics.Arcade.Sprite;
  label: Phaser.GameObjects.Text;
  score: number;
  cooldown: number;
  stunUntil: number;
}

interface PrizeCrate {
  id: number;
  body: Phaser.GameObjects.Container;
  hitbox: Phaser.GameObjects.Rectangle;
  hp: number;
  value: number;
  rare: boolean;
  explosive: boolean;
  isGolden: boolean;
}

export class CrateBreakScene extends Phaser.Scene {
  private gameState!: GameState;
  private ui!: UIScene;
  private audio: AudioManager | null = null;
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
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    this.add.image(W / 2, H / 2, "crate-arena-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, 0x030712, 0.12).setOrigin(0);
    this.add.text(W / 2, 18, "CRATE BREAK", {
      fontSize: "25px", fontFamily: "sans-serif", color: "#c4a7ff", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(W / 2, 48, "Move close and press SPACE — or tap a nearby crate.", {
      fontSize: "11px", fontFamily: "sans-serif", color: "#ffffff",
    }).setOrigin(0.5);

    this.physics.world.setBounds(8, 62, W - 16, H - 120);
    this.ui = this.scene.get("UIScene") as UIScene;
    this.audio = this.registry.get("audio") as AudioManager | null;
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
      sprite.setDisplaySize(40, 40);
      const label = this.add.text(sprite.x, sprite.y - 29, player.displayName.slice(0, 9), {
        fontSize: "9px", color: "#ffffff", backgroundColor: "#07142faa",
      }).setOrigin(0.5).setDepth(13);
      const breaker: Breaker = {
        id: player.id, name: player.displayName, isBot: player.isBot,
        sprite, label, score: 0, cooldown: 0, stunUntil: 0,
      };
      for (const other of this.breakers) this.physics.add.collider(sprite, other.sprite);
      this.breakers.push(breaker);
    });

    for (let index = 0; index < 12; index++) this.spawnCrate();
    this.ui.showMinigameIntro({
      title: "Crate Coliseum",
      kicker: "Free-for-all challenge",
      objective: "Smash prize crates. Golden crates are worth the most — but watch out for orange explosives!",
      controls: "ARROWS / WASD to move  •  SPACE to smash",
      tip: "Get close before swinging. Orange crates explode and stun nearby players!",
      accent: 0xc4a7ff,
    }, () => this.showCountdown(() => {
      this.ui.showMinigameTimer(ROUND_SECONDS);
      this.active = true;
      this.time.delayedCall(ROUND_SECONDS * 1000, () => this.finishRound());
    }));
  }

  update(_time: number, delta: number) {
    if (!this.active) return;
    const human = this.breakers.find((breaker) => !breaker.isBot);
    if (human) {
      const stunned = this.time.now < human.stunUntil;
      if (stunned) {
        human.sprite.setVelocity(0);
      } else {
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
      // Flash the sprite while stunned
      if (stunned && Math.floor(this.time.now / 80) % 2 === 0) {
        human.sprite.setAlpha(0.35);
      } else {
        human.sprite.setAlpha(1);
      }
    }

    for (const bot of this.breakers.filter((breaker) => breaker.isBot)) {
      bot.cooldown = Math.max(0, bot.cooldown - delta);
      const stunned = this.time.now < bot.stunUntil;
      if (stunned) { bot.sprite.setVelocity(0); continue; }
      // Improved target scoring: heavily prefer golden crates
      const crate = this.crates.slice().sort((a, b) => {
        const scoreA = a.value * 90 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, a.body.x, a.body.y) * 0.8;
        const scoreB = b.value * 90 - Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, b.body.x, b.body.y) * 0.8;
        return scoreB - scoreA;
      })[0];
      if (!crate) continue;
      const distance = Phaser.Math.Distance.Between(bot.sprite.x, bot.sprite.y, crate.body.x, crate.body.y);
      if (distance > 58) this.physics.moveToObject(bot.sprite, crate.body, BOT_SPEED);
      else {
        bot.sprite.setVelocity(0);
        if (bot.cooldown <= 0) this.hitCrate(bot, crate);
      }
    }
    this.breakers.forEach((breaker) => breaker.label.setPosition(breaker.sprite.x, breaker.sprite.y - 29));
  }

  private spawnCrate() {
    const roll = Math.random();
    const isGolden = roll < 0.05;
    const explosive = !isGolden && roll < 0.13; // 8% explosive after 5% golden
    const rare = !isGolden && !explosive && roll < 0.41; // 28% rare of remaining

    const x = Phaser.Math.Between(90, 710);
    const y = Phaser.Math.Between(100, 340);

    let fillColor: number;
    let size: number;
    let hp: number;
    let value: number;
    if (isGolden)    { fillColor = 0xffd700; size = 60; hp = 5; value = 6; }
    else if (explosive){ fillColor = 0xff7324; size = 50; hp = 2; value = 1; }
    else if (rare)   { fillColor = 0x7c3aed; size = 58; hp = 3; value = 4; }
    else             { fillColor = 0x5b3fb2; size = 50; hp = 2; value = 2; }

    const hitbox = this.add.rectangle(0, 0, size, size, fillColor, 1).setStrokeStyle(4, 0x07142f);
    const crossA = this.add.rectangle(0, 0, size - 8, 6, 0xffd166).setAngle(45);
    const crossB = this.add.rectangle(0, 0, size - 8, 6, 0xffd166).setAngle(-45);
    const badge = this.add.image(0, 0, isGolden ? "grand-cap-art" : explosive ? "space-raid-art" : "space-capsule-art")
      .setDisplaySize(26, 26);
    const body = this.add.container(x, y, [hitbox, crossA, crossB, badge]).setDepth(7);

    // Golden crate gets a persistent glow
    if (isGolden) {
      this.tweens.add({
        targets: hitbox, fillColor: 0xffe066, duration: 600, yoyo: true, repeat: -1,
      });
    }

    const crate: PrizeCrate = {
      id: this.nextCrateId++, body, hitbox, hp, value,
      rare: rare || isGolden, explosive, isGolden,
    };
    this.crates.push(crate);
    this.tweens.add({ targets: body, scaleX: { from: 0, to: 1 }, scaleY: { from: 0, to: 1 }, duration: 220, ease: "Back.Out" });
  }

  private nearestCrate(x: number, y: number) {
    return this.crates.slice().sort((a, b) =>
      Phaser.Math.Distance.Between(x, y, a.body.x, a.body.y) -
      Phaser.Math.Distance.Between(x, y, b.body.x, b.body.y))[0];
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

    if (crate.explosive) {
      this.detonateExplosive(crate);
      return;
    }

    if (crate.isGolden) this.audio?.play("grand-cap");
    breaker.score += crate.value;
    const scoreText = this.add.text(crate.body.x, crate.body.y, `+${crate.value}`, {
      fontSize: "18px", color: crate.isGolden ? "#ffd700" : crate.rare ? "#c4a7ff" : "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: scoreText, y: scoreText.y - 35, alpha: 0, duration: 650, onComplete: () => scoreText.destroy() });
    crate.body.destroy();
    this.crates = this.crates.filter((candidate) => candidate.id !== crate.id);
    this.time.delayedCall(250, () => this.spawnCrate());
  }

  private detonateExplosive(crate: PrizeCrate) {
    this.audio?.play("trap");
    const cx = crate.body.x;
    const cy = crate.body.y;
    const shockwave = this.add.circle(cx, cy, 5, 0xff7324, 0.85).setDepth(18);
    this.tweens.add({
      targets: shockwave, radius: 90, alpha: 0, duration: 400, ease: "Cubic.Out",
      onComplete: () => shockwave.destroy(),
    });
    crate.body.destroy();
    this.crates = this.crates.filter((candidate) => candidate.id !== crate.id);
    this.time.delayedCall(300, () => this.spawnCrate());

    // Stun all players within 90px
    for (const b of this.breakers) {
      const dist = Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, cx, cy);
      if (dist < 90) {
        b.score = Math.max(0, b.score - 1);
        b.stunUntil = this.time.now + 800;
        b.sprite.setVelocity(0);
        const stunText = this.add.text(b.sprite.x, b.sprite.y - 30, "STUNNED!", {
          fontSize: "11px", color: "#ff7324", fontStyle: "bold",
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: stunText, y: stunText.y - 20, alpha: 0, duration: 700, onComplete: () => stunText.destroy() });
      }
    }
  }

  private showCountdown(done: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    let count = 3;
    const tick = () => {
      if (!count) { done(); return; }
      this.audio?.play("countdown");
      const text = this.add.text(W / 2, H / 2, `${count}`, {
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
    this.audio?.play("minigame-win");
    const leave = () => {
      this.scene.stop();
      const board = this.scene.get("BoardScene") as BoardScene;
      board.onMinigameComplete(ranked.map((breaker, index) => ({ playerId: breaker.id, coins: rewards[index] ?? 1 })));
    };
    this.ui.showMinigameResults("Crate Coliseum", 0xc4a7ff, ranked.map((breaker) => ({
      name: breaker.name,
      score: breaker.score,
    })), leave);
  }
}
