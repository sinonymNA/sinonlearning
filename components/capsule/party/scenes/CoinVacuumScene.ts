import Phaser from "phaser";
import { type GameState } from "../GameState";
import { EventBus } from "../EventBus";
import { PLACEHOLDER, PLAYER_RADIUS, COIN_RADIUS } from "../AssetManifest";
import type { UIScene } from "./UIScene";
import type { BoardScene } from "./BoardScene";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { partyText } from "../Presentation";

const ROUND_SECONDS = 35;
const COIN_SPAWN_INTERVAL = 900;  // ms
const MAX_COINS = 30;
const PLAYER_SPEED = 200;
const BOT_SPEED = 74;
const MAGNET_RADIUS = 100;
const MAGNET_COOLDOWN = 4000;

interface MinigamePlayer {
  id: string;
  displayName: string;
  colorIndex: number;
  isBot: boolean;
  body: Phaser.Physics.Arcade.Sprite;
  coins: number;
  magnetCooldown: number;
  botTarget: string | null; // coin game object name
  slowUntil: number;
  label: Phaser.GameObjects.Text;
}

interface CoinObject {
  id: string;
  type: "normal" | "bonus" | "fake";
  sprite: Phaser.Physics.Arcade.Sprite;
  value: number;
}

export class CoinVacuumScene extends Phaser.Scene {
  private players: MinigamePlayer[] = [];
  private coins: CoinObject[] = [];
  private humanPlayer: MinigamePlayer | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private actionKey!: Phaser.Input.Keyboard.Key;
  private gameState!: GameState;
  private ui!: UIScene;
  private roundActive = false;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private scoreTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private virtualJoystick: { active: boolean; startX: number; startY: number; currentX: number; currentY: number } = {
    active: false, startX: 0, startY: 0, currentX: 0, currentY: 0,
  };
  private joystickKnob: Phaser.GameObjects.Arc | null = null;
  private joystickBase: Phaser.GameObjects.Arc | null = null;

  constructor() {
    super({ key: "CoinVacuumScene" });
  }

  init(data: { state: GameState }) {
    this.gameState = data.state;
    this.players = [];
    this.coins = [];
    this.roundActive = false;
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    this.physics.world.setBounds(0, 0, W, H);

    // Arena background
    this.add.image(W / 2, H / 2, "arena-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.ARENA_BG, 0.12).setOrigin(0);

    // Walls (visual only — world bounds handle physics)
    const wallColor = PLACEHOLDER.WALL_COLOR;
    this.add.rectangle(0, 0, W, 8, wallColor, 1).setOrigin(0);
    this.add.rectangle(0, H - 8, W, 8, wallColor, 1).setOrigin(0);
    this.add.rectangle(0, 0, 8, H, wallColor, 1).setOrigin(0);
    this.add.rectangle(W - 8, 0, 8, H, wallColor, 1).setOrigin(0);

    this.ui = this.scene.get("UIScene") as UIScene;
    this.scene.bringToTop("UIScene");
    EventBus.emit("phaser:phase-change", { phase: "minigame" });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.actionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.setupVirtualJoystick();
    this.spawnPlayers();
    this.renderScoreboard();
    this.ui.showMinigameIntro({
      title: "Coin Vacuum",
      kicker: "Free-for-all challenge",
      objective: "Grab more gold than anyone else before time runs out.",
      controls: "ARROWS / WASD to move  •  SPACE for magnet",
      tip: "Gold is good. Red fakes slow you down.",
      accent: 0x2dd4bf,
    }, () => this.showCountdown(() => {
      this.spawnInitialCoins();
      this.ui.showMinigameTimer(ROUND_SECONDS);
      this.roundActive = true;
      this.spawnTimer = this.time.addEvent({ delay: COIN_SPAWN_INTERVAL, repeat: -1, callback: this.spawnCoin, callbackScope: this });
      this.time.delayedCall(ROUND_SECONDS * 1000, () => this.endRound());
    }));
  }

  update(_time: number, delta: number) {
    if (!this.roundActive) return;

    // Human player movement
    if (this.humanPlayer) {
      const body = this.humanPlayer.body;
      let vx = 0, vy = 0;

      if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -PLAYER_SPEED;
      else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = PLAYER_SPEED;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -PLAYER_SPEED;
      else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = PLAYER_SPEED;

      // Virtual joystick override
      if (this.virtualJoystick.active) {
        const dx = this.virtualJoystick.currentX - this.virtualJoystick.startX;
        const dy = this.virtualJoystick.currentY - this.virtualJoystick.startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 10) {
          vx = (dx / len) * PLAYER_SPEED;
          vy = (dy / len) * PLAYER_SPEED;
        }
      }

      const speedScale = this.time.now < this.humanPlayer.slowUntil ? 0.45 : 1;
      body.setVelocity(vx * speedScale, vy * speedScale);

      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
        this.activateMagnet(this.humanPlayer);
      }
    }

    // Bot AI
    for (const p of this.players) {
      if (!p.isBot) continue;
      p.magnetCooldown = Math.max(0, p.magnetCooldown - delta);
      this.updateBotMovement(p);
      if (p.magnetCooldown <= 0 && Math.random() < 0.003) {
        this.activateMagnet(p);
      }
    }

    // Check coin pickups
    this.checkCoinPickups();
    this.updateScoreboard();
    this.updateJoystickKnob();
    this.players.forEach((player) => player.label.setPosition(player.body.x, player.body.y - PLAYER_RADIUS - 14));
  }

  private charTextureKey(gp: { capId: string; colorIndex: number }): string {
    const capId = gp.capId?.replace(/^cap-/, "") ?? "";
    const key = `cap-char-${capId}-${gp.colorIndex}`;
    return this.textures.exists(key) ? key : `player-${gp.colorIndex}`;
  }

  private spawnPlayers() {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const positions = [
      { x: 80, y: 80 }, { x: W - 80, y: 80 },
      { x: 80, y: H - 80 }, { x: W - 80, y: H - 80 },
    ];

    this.gameState.players.forEach((gp, i) => {
      const pos = positions[i % 4];
      const texKey = this.charTextureKey(gp);
      const sprite = this.physics.add.sprite(pos.x, pos.y, texKey);
      sprite.setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
      sprite.setCollideWorldBounds(true);
      sprite.setCircle(PLAYER_RADIUS, 0, 0);
      sprite.setDepth(20);

      const label = partyText(this, pos.x, pos.y - PLAYER_RADIUS - 14, gp.displayName.slice(0, 8), 10, "#ffffff", {
        stroke: "#020817", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(21);
      const mp: MinigamePlayer = {
        id: gp.id,
        displayName: gp.displayName,
        colorIndex: gp.colorIndex,
        isBot: gp.isBot,
        body: sprite,
        coins: 0,
        magnetCooldown: 0,
        botTarget: null,
        slowUntil: 0,
        label,
      };
      for (const other of this.players) this.physics.add.collider(sprite, other.body);
      this.players.push(mp);
      if (!gp.isBot) this.humanPlayer = mp;

    });
  }

  private spawnInitialCoins() {
    for (let i = 0; i < 14; i++) this.spawnCoin();
  }

  private spawnCoin() {
    if (this.coins.length >= MAX_COINS) return;
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const x = Phaser.Math.Between(24, W - 24);
    const y = Phaser.Math.Between(64, H - 64);

    const roll = Math.random();
    let type: CoinObject["type"] = "normal";
    let textureKey = this.textures.exists("coin-gold-art") ? "coin-gold-art" : "coin-normal";
    let value = 1;
    if (roll < 0.12) { type = "bonus"; textureKey = "grand-cap-art"; value = 3; }
    else if (roll < 0.22) { type = "fake"; textureKey = this.textures.exists("coin-fake-art") ? "coin-fake-art" : "coin-fake"; value = -2; }

    const sprite = this.physics.add.sprite(x, y, textureKey);
    sprite.setDisplaySize(type === "bonus" ? 30 : 26, type === "bonus" ? 30 : 26);
    sprite.setCircle(COIN_RADIUS);
    sprite.setDepth(10);

    // Gentle float animation
    this.tweens.add({
      targets: sprite, y: y - 6, duration: 800 + Math.random() * 400,
      yoyo: true, repeat: -1, ease: "Sine.InOut", delay: Math.random() * 600,
    });

    const coin: CoinObject = { id: `coin-${Date.now()}-${Math.random()}`, type, sprite, value };
    this.coins.push(coin);
  }

  private checkCoinPickups() {
    for (const p of this.players) {
      const px = p.body.x;
      const py = p.body.y;

      for (let i = this.coins.length - 1; i >= 0; i--) {
        const c = this.coins[i];
        const cx = c.sprite.x;
        const cy = c.sprite.y;
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
        if (dist < PLAYER_RADIUS + COIN_RADIUS + 4) {
          p.coins += c.value;
          if (c.type === "fake") {
            p.slowUntil = this.time.now + 1800;
            this.showFloatingText(cx, cy, `${c.value}`, "#ef4444");
            this.showFloatingText(px, py - 18, "SLOWED!", "#ef4444");
          } else {
            this.showFloatingText(cx, cy, `+${c.value}`, c.type === "bonus" ? "#00ffff" : "#ffd700");
          }
          c.sprite.destroy();
          this.coins.splice(i, 1);
        }
      }
    }
  }

  private activateMagnet(player: MinigamePlayer) {
    if (player.magnetCooldown > 0) return;
    player.magnetCooldown = MAGNET_COOLDOWN;

    const px = player.body.x;
    const py = player.body.y;

    // Visual ring
    const ring = this.add.image(px, py, "magnet-pulse").setAlpha(0.8).setDepth(25);
    this.tweens.add({
      targets: ring, scaleX: 1.5, scaleY: 1.5, alpha: 0,
      duration: 400, ease: "Cubic.Out", onComplete: () => ring.destroy(),
    });

    // Pull nearby non-fake coins
    for (const c of this.coins) {
      if (c.type === "fake") continue;
      const dist = Phaser.Math.Distance.Between(px, py, c.sprite.x, c.sprite.y);
      if (dist < MAGNET_RADIUS) {
        this.tweens.add({
          targets: c.sprite, x: px, y: py, duration: 300, ease: "Cubic.In",
        });
      }
    }
  }

  private updateBotMovement(bot: MinigamePlayer) {
    // Find nearest non-fake coin
    let nearest: CoinObject | null = null;
    let nearestDist = Infinity;
    for (const c of this.coins) {
      if (c.type === "fake") continue;
      const d = Phaser.Math.Distance.Between(bot.body.x, bot.body.y, c.sprite.x, c.sprite.y);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }

    if (nearest) {
      const angle = Phaser.Math.Angle.Between(bot.body.x, bot.body.y, nearest.sprite.x, nearest.sprite.y);
      const speed = this.time.now < bot.slowUntil ? BOT_SPEED * 0.45 : BOT_SPEED;
      bot.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      // Wander
      if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        bot.body.setVelocity(Math.cos(angle) * BOT_SPEED * 0.5, Math.sin(angle) * BOT_SPEED * 0.5);
      }
    }
  }

  private renderScoreboard() {
    const W = PARTY_WIDTH;
    const startX = W - 146;
    this.players.forEach((p, i) => {
      const y = 17 + i * 25;
      this.add.image(startX + 68, y + 8, "hud-player").setDisplaySize(145, 25).setAlpha(0.9).setDepth(99);
      const t = partyText(this, startX + 8, y + 8, `${p.displayName.slice(0, 8)}  0`, 10, "#ffffff")
        .setOrigin(0, 0.5).setDepth(100);
      this.scoreTexts.set(p.id, t);
    });
  }

  private updateScoreboard() {
    for (const p of this.players) {
      const t = this.scoreTexts.get(p.id);
      if (t) t.setText(`${p.displayName.slice(0, 8)}  ${Math.max(0, p.coins)}`);
    }
  }

  private showCountdown(onDone: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    let count = 3;
    const doCount = () => {
      if (count <= 0) { onDone(); return; }
      const t = this.add.text(W / 2, H / 2, count.toString(), {
        fontSize: "96px", fontFamily: "monospace", color: "#ffd700", fontStyle: "bold",
        stroke: "#000000", strokeThickness: 6,
      }).setOrigin(0.5).setDepth(500).setAlpha(0);
      this.tweens.add({
        targets: t, alpha: 1, scaleX: 0.8, scaleY: 0.8, duration: 200, ease: "Back.Out",
        onComplete: () => {
          this.time.delayedCall(700, () => {
            this.tweens.add({
              targets: t, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 200, ease: "Cubic.In",
              onComplete: () => { t.destroy(); count--; doCount(); },
            });
          });
        },
      });
    };
    doCount();
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontSize: "14px", fontFamily: "monospace", color, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: t, y: y - 30, alpha: 0, duration: 800, ease: "Cubic.Out",
      onComplete: () => t.destroy(),
    });
  }

  private setupVirtualJoystick() {
    if (!this.sys.game.device.input.touch) return;
    const H = PARTY_HEIGHT;
    const W = PARTY_WIDTH;

    this.joystickBase = this.add.circle(80, H - 80, 40, 0x334155, 0.5).setDepth(200).setInteractive();
    this.joystickKnob = this.add.circle(80, H - 80, 20, 0x19cdd2, 0.8).setDepth(201);

    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      if (ptr.x < W / 2) {
        this.virtualJoystick.active = true;
        this.virtualJoystick.startX = ptr.x;
        this.virtualJoystick.startY = ptr.y;
        this.virtualJoystick.currentX = ptr.x;
        this.virtualJoystick.currentY = ptr.y;
        this.joystickBase!.setPosition(ptr.x, ptr.y);
        this.joystickKnob!.setPosition(ptr.x, ptr.y);
      } else if (ptr.x > W * 0.7) {
        // Right side tap = magnet action
        if (this.humanPlayer) this.activateMagnet(this.humanPlayer);
      }
    });
    this.input.on("pointermove", (ptr: Phaser.Input.Pointer) => {
      if (this.virtualJoystick.active && ptr.isDown) {
        this.virtualJoystick.currentX = ptr.x;
        this.virtualJoystick.currentY = ptr.y;
      }
    });
    this.input.on("pointerup", () => {
      this.virtualJoystick.active = false;
      if (this.humanPlayer) {
        this.humanPlayer.body.setVelocity(0, 0);
        this.joystickKnob?.setPosition(this.joystickBase?.x ?? 80, this.joystickBase?.y ?? (PARTY_HEIGHT - 80));
      }
    });
  }

  private updateJoystickKnob() {
    if (!this.virtualJoystick.active || !this.joystickKnob || !this.joystickBase) return;
    const dx = this.virtualJoystick.currentX - this.virtualJoystick.startX;
    const dy = this.virtualJoystick.currentY - this.virtualJoystick.startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 36;
    if (len > maxRadius) {
      const scale = maxRadius / len;
      this.joystickKnob.setPosition(
        this.joystickBase.x + dx * scale,
        this.joystickBase.y + dy * scale
      );
    } else {
      this.joystickKnob.setPosition(
        this.joystickBase.x + dx,
        this.joystickBase.y + dy
      );
    }
  }

  private endRound() {
    this.roundActive = false;
    this.spawnTimer?.remove();
    this.ui.hideMinigameTimer();

    // Stop all players
    this.players.forEach(p => p.body.setVelocity(0, 0));

    // Sort by coins
    const sorted = [...this.players].sort((a, b) => b.coins - a.coins);

    // Reward coins (1st: 8, 2nd: 5, 3rd: 3, 4th: 1)
    const rewards = [8, 5, 3, 1];
    const coinRewards = sorted.map((p, i) => ({ playerId: p.id, coins: rewards[i] ?? 1 }));

    // Show results overlay
    this.ui.showMinigameResults("Coin Vacuum", 0x2dd4bf, sorted.map((player) => ({
      name: player.displayName,
      score: player.coins,
    })), () => {
      this.scene.stop("CoinVacuumScene");
      this.scene.resume("BoardScene");
      const board = this.scene.get("BoardScene") as BoardScene;
      board.onMinigameComplete(coinRewards);
    });
  }

  private showResultsOverlay(sorted: MinigamePlayer[], onContinue: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    this.add.rectangle(W / 2, H / 2, 400, 260, 0x0f172a, 0.97).setOrigin(0.5).setDepth(600);
    this.add.rectangle(W / 2, H / 2, 400, 260, 0, 0).setStrokeStyle(2, 0x19cdd2).setOrigin(0.5).setDepth(601);
    this.add.text(W / 2, H / 2 - 110, "COIN VACUUM RESULTS", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#19cdd2", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(602);

    const medals = ["🥇", "🥈", "🥉", "4th"];
    sorted.forEach((p, i) => {
      const y = H / 2 - 70 + i * 38;
      this.add.text(W / 2 - 140, y, `${medals[i] ?? (i + 1)}.`, {
        fontSize: "18px", fontFamily: "sans-serif", color: "#ffd700",
      }).setOrigin(0, 0.5).setDepth(602);
      this.add.text(W / 2 - 110, y, p.displayName.slice(0, 12), {
        fontSize: "15px", fontFamily: "sans-serif", color: "#e2e8f0",
      }).setOrigin(0, 0.5).setDepth(602);
      this.add.text(W / 2 + 100, y, `${Math.max(0, p.coins)} coins`, {
        fontSize: "13px", fontFamily: "monospace", color: "#ffd700",
      }).setOrigin(0, 0.5).setDepth(602);
    });

    const btn = this.add.text(W / 2, H / 2 + 100, "Continue →", {
      fontSize: "16px", fontFamily: "sans-serif", color: "#0f172a",
      backgroundColor: "#19cdd2", padding: { x: 20, y: 8 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(602).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => onContinue());
    btn.on("pointerover", () => btn.setBackgroundColor("#10e0e8"));
    btn.on("pointerout", () => btn.setBackgroundColor("#19cdd2"));
  }
}

