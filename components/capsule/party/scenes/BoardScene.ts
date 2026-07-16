import Phaser from "phaser";
import { BOARD_SPACES, BOARD_SPACE_MAP, type BoardSpace, GRAND_CAPS_TO_WIN, SPIN_CORRECT_RANGE, SPIN_INCORRECT_RANGE } from "../BoardData";
import { createInitialState, type GameState, type PlayerState, getPathSteps, rankPlayers } from "../GameState";
import { EventBus } from "../EventBus";
import { PLACEHOLDER, SPACE_RADIUS, TOKEN_RADIUS } from "../AssetManifest";
import type { UIScene } from "./UIScene";

interface BoardSceneData {
  players: { id: string; displayName: string; capId: string; colorIndex: number }[];
}

const TWEEN_STEP_DURATION = 250; // ms per board step
const TWEEN_STEP_GAP = 60;       // ms pause between steps

// Sample questions — replaced by server questions in production
const SAMPLE_QUESTIONS = [
  { q: "What does GDP stand for?", choices: ["Gross Domestic Product", "General Dollar Price", "Government Debt Plan", "Gross Direct Payment"], answer: 0 },
  { q: "Which is a primary market?", choices: ["Stock exchange trading", "IPO share sale", "Bond secondary market", "Derivative contract"], answer: 1 },
  { q: "What is inflation?", choices: ["Falling prices", "Rising average prices", "Tax rate increase", "Currency appreciation"], answer: 1 },
  { q: "A P/E ratio compares price to...", choices: ["Earnings per share", "Employee count", "Product sales", "Equity value"], answer: 0 },
  { q: "Diversification reduces...", choices: ["Returns", "Unsystematic risk", "Market risk", "Dividend yield"], answer: 1 },
];

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tokenObjects: Phaser.GameObjects.Container[] = [];
  private grandCapObject: Phaser.GameObjects.Image | null = null;
  private spaceObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private ui!: UIScene;
  private currentPhase: "question" | "spin" | "move" | "land" | "idle" = "idle";
  private pendingSteps = 0;
  private spinDisplay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "BoardScene" });
  }

  init(data: BoardSceneData) {
    const botSlots = data.players.filter(p => p.id.startsWith("bot-"));
    const humanSlots = data.players.filter(p => !p.id.startsWith("bot-"));
    const allPlayers = [...humanSlots, ...botSlots].map((p, i) => ({
      ...p,
      isBot: p.id.startsWith("bot-"),
      colorIndex: i,
    }));
    this.state = createInitialState(allPlayers);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 1).setOrigin(0);

    this.ui = this.scene.get("UIScene") as UIScene;

    this.drawPaths();
    this.drawSpaces();
    this.drawTokens();
    this.drawGrandCap();

    // Push initial score
    this.emitScoreUpdate();

    // Short delay before first turn
    this.time.delayedCall(800, () => this.startTurn());
  }

  // --- Board drawing ---

  private drawPaths() {
    const g = this.add.graphics();
    g.lineStyle(3, PLACEHOLDER.PATH_COLOR, 0.8);

    for (const space of BOARD_SPACES) {
      for (const nextId of space.connections) {
        const next = BOARD_SPACE_MAP.get(nextId);
        if (!next) continue;
        g.lineBetween(space.x, space.y, next.x, next.y);
      }
    }

    // Arrow heads on paths
    for (const space of BOARD_SPACES) {
      for (const nextId of space.connections) {
        const next = BOARD_SPACE_MAP.get(nextId);
        if (!next) continue;
        const angle = Phaser.Math.Angle.Between(space.x, space.y, next.x, next.y);
        const mx = (space.x + next.x) / 2;
        const my = (space.y + next.y) / 2;
        g.fillStyle(PLACEHOLDER.PATH_COLOR, 0.8);
        // Tiny arrow at midpoint
        const size = 5;
        const points = [
          { x: mx + Math.cos(angle) * size, y: my + Math.sin(angle) * size },
          { x: mx + Math.cos(angle + 2.4) * size * 0.6, y: my + Math.sin(angle + 2.4) * size * 0.6 },
          { x: mx + Math.cos(angle - 2.4) * size * 0.6, y: my + Math.sin(angle - 2.4) * size * 0.6 },
        ];
        g.fillTriangle(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);
      }
    }
  }

  private drawSpaces() {
    for (const space of BOARD_SPACES) {
      const img = this.add.image(space.x, space.y, `space-${space.type}`);
      const label = this.add.text(space.x, space.y + SPACE_RADIUS + 7, this.spaceLabel(space.type), {
        fontSize: "8px", fontFamily: "sans-serif", color: "#94a3b8",
      }).setOrigin(0.5, 0);
      const container = this.add.container(0, 0, [img, label]);
      this.spaceObjects.set(space.id, container);
    }
  }

  private spaceLabel(type: string): string {
    const map: Record<string, string> = {
      coin: "+G", raid: "RAID", capsule: "CAP", shop: "SHOP",
      trap: "TRAP", challenge: "?", warp: "WARP", grand_cap: "GC", start: "GO",
    };
    return map[type] ?? type;
  }

  private drawTokens() {
    this.tokenObjects.forEach(t => t.destroy());
    this.tokenObjects = [];

    for (let i = 0; i < this.state.players.length; i++) {
      const p = this.state.players[i];
      const space = BOARD_SPACE_MAP.get(p.spaceId)!;
      const offset = this.tokenOffset(i, this.state.players.length);
      const circle = this.add.circle(0, 0, TOKEN_RADIUS, PLACEHOLDER.PLAYER_COLORS[p.colorIndex] ?? 0x888888).setStrokeStyle(2, 0xffffff);
      const letter = this.add.text(0, 0, p.displayName[0].toUpperCase(), {
        fontSize: "12px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      }).setOrigin(0.5);
      const container = this.add.container(space.x + offset.x, space.y + offset.y, [circle, letter]).setDepth(10);
      this.tokenObjects.push(container);
    }
  }

  private tokenOffset(index: number, total: number): { x: number; y: number } {
    const offsets = [
      { x: -8, y: -8 }, { x: 8, y: -8 }, { x: -8, y: 8 }, { x: 8, y: 8 },
    ];
    return offsets[index % offsets.length];
  }

  private drawGrandCap() {
    this.grandCapObject?.destroy();
    const space = BOARD_SPACE_MAP.get(this.state.activeGrandCapId);
    if (!space) return;
    this.grandCapObject = this.add.image(space.x, space.y - SPACE_RADIUS - 14, "grand-cap-pedestal").setDepth(5);
    this.tweens.add({
      targets: this.grandCapObject, y: space.y - SPACE_RADIUS - 20, duration: 1000,
      yoyo: true, repeat: -1, ease: "Sine.InOut",
    });
  }

  // --- Turn flow ---

  private startTurn() {
    if (this.currentPhase !== "idle") return;
    const player = this.currentPlayer();
    this.ui.showTurnBanner(
      `${player.displayName}'s Turn`,
      player.isBot ? "Bot is thinking..." : "Answer a question to move!",
      1800
    );

    this.time.delayedCall(600, () => {
      if (player.isBot) {
        this.handleBotTurn();
      } else {
        this.askQuestion();
      }
    });
  }

  private askQuestion() {
    const q = Phaser.Utils.Array.GetRandom(SAMPLE_QUESTIONS) as typeof SAMPLE_QUESTIONS[0];
    this.currentPhase = "question";

    this.ui.showQuestion(
      { q: q.q, choices: q.choices, timeLimit: 15 },
      (chosenIdx) => {
        const correct = chosenIdx === q.answer;
        const player = this.currentPlayer();
        player.totalAnswers++;
        if (correct) player.correctAnswers++;
        this.doSpin(correct);
      }
    );
  }

  private handleBotTurn() {
    // Bots always "answer" after a short delay — random 60% correct
    this.time.delayedCall(800, () => {
      const correct = Math.random() < 0.6;
      const player = this.currentPlayer();
      player.totalAnswers++;
      if (correct) player.correctAnswers++;
      this.doSpin(correct);
    });
  }

  private doSpin(correct: boolean) {
    this.currentPhase = "spin";
    const player = this.currentPlayer();

    let steps: number;
    if (player.items.includes("golden-spinner")) {
      steps = Phaser.Math.Between(5, 6);
      player.items = player.items.filter(i => i !== "golden-spinner");
    } else if (correct) {
      steps = Phaser.Math.Between(SPIN_CORRECT_RANGE[0], SPIN_CORRECT_RANGE[1]);
    } else {
      steps = Phaser.Math.Between(SPIN_INCORRECT_RANGE[0], SPIN_INCORRECT_RANGE[1]);
    }

    this.showSpinResult(steps, correct, () => {
      this.movePlayer(this.state.turnIndex, steps);
    });
  }

  private showSpinResult(steps: number, correct: boolean, onDone: () => void) {
    const W = this.scale.width;
    const H = this.scale.height;

    if (this.spinDisplay) { this.spinDisplay.destroy(); this.spinDisplay = null; }

    const bg = this.add.rectangle(0, 0, 160, 90, 0x0f172a, 0.95).setOrigin(0);
    const resultTxt = this.add.text(80, 18, correct ? "CORRECT!" : "Incorrect", {
      fontSize: "16px", fontFamily: "sans-serif",
      color: correct ? "#16a34a" : "#ef4444", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    const stepsTxt = this.add.text(80, 46, `Move ${steps} space${steps !== 1 ? "s" : ""}`, {
      fontSize: "22px", fontFamily: "monospace", color: "#ffd700", fontStyle: "bold",
    }).setOrigin(0.5, 0);

    this.spinDisplay = this.add.container((W - 160) / 2, (H - 90) / 2 - 40, [bg, resultTxt, stepsTxt]).setDepth(350);
    this.tweens.add({ targets: this.spinDisplay, alpha: { from: 0, to: 1 }, duration: 200 });

    this.time.delayedCall(1400, () => {
      if (this.spinDisplay) {
        this.tweens.add({
          targets: this.spinDisplay, alpha: 0, duration: 200,
          onComplete: () => { this.spinDisplay?.destroy(); this.spinDisplay = null; onDone(); },
        });
      }
    });
  }

  private movePlayer(playerIdx: number, steps: number) {
    this.currentPhase = "move";
    const player = this.state.players[playerIdx];
    const path = this.getPath(player.spaceId, steps);

    if (path.length === 0) {
      this.onLand(playerIdx);
      return;
    }

    this.animateAlongPath(playerIdx, path, 0, () => {
      player.spaceId = path[path.length - 1];
      this.onLand(playerIdx);
    });
  }

  private getPath(fromId: string, count: number): string[] {
    // For branch points (multiple connections), pick a connection randomly for bots / first for now
    const path: string[] = [];
    let current = fromId;
    for (let i = 0; i < count; i++) {
      const space = BOARD_SPACE_MAP.get(current);
      if (!space || space.connections.length === 0) break;
      const nextId = space.connections.length > 1
        ? Phaser.Utils.Array.GetRandom(space.connections) as string
        : space.connections[0];
      path.push(nextId);
      current = nextId;
    }
    return path;
  }

  private animateAlongPath(playerIdx: number, path: string[], stepIdx: number, onComplete: () => void) {
    if (stepIdx >= path.length) { onComplete(); return; }

    const token = this.tokenObjects[playerIdx];
    const nextSpace = BOARD_SPACE_MAP.get(path[stepIdx]);
    if (!token || !nextSpace) { onComplete(); return; }

    const offset = this.tokenOffset(playerIdx, this.state.players.length);
    this.tweens.add({
      targets: token,
      x: nextSpace.x + offset.x,
      y: nextSpace.y + offset.y,
      duration: TWEEN_STEP_DURATION,
      ease: "Cubic.InOut",
      onComplete: () => {
        this.time.delayedCall(TWEEN_STEP_GAP, () => {
          this.animateAlongPath(playerIdx, path, stepIdx + 1, onComplete);
        });
      },
    });
  }

  private onLand(playerIdx: number) {
    this.currentPhase = "land";
    const player = this.state.players[playerIdx];
    const space = BOARD_SPACE_MAP.get(player.spaceId);
    if (!space) { this.endTurn(); return; }

    // Handle warp
    if (space.type === "warp" && space.warpTargetId) {
      const dest = BOARD_SPACE_MAP.get(space.warpTargetId);
      if (dest) {
        this.ui.showMessage(`WARP! → ${dest.label ?? space.warpTargetId}`, "#ec4899", 1500);
        this.time.delayedCall(400, () => {
          player.spaceId = space.warpTargetId!;
          const token = this.tokenObjects[playerIdx];
          const offset = this.tokenOffset(playerIdx, this.state.players.length);
          this.tweens.add({
            targets: token, x: dest.x + offset.x, y: dest.y + offset.y,
            duration: 400, ease: "Back.Out",
            onComplete: () => this.resolveSpace(playerIdx),
          });
        });
        return;
      }
    }

    this.resolveSpace(playerIdx);
  }

  private resolveSpace(playerIdx: number) {
    const player = this.state.players[playerIdx];
    const space = BOARD_SPACE_MAP.get(player.spaceId);
    if (!space) { this.endTurn(); return; }

    switch (space.type) {
      case "coin": {
        const earned = Phaser.Math.Between(2, 5);
        player.coins += earned;
        this.ui.showMessage(`+${earned} coins!`, "#ffd700");
        this.time.delayedCall(1200, () => this.endTurn());
        break;
      }
      case "grand_cap": {
        if (space.id === this.state.activeGrandCapId) {
          this.purchaseGrandCap(playerIdx);
        } else {
          this.ui.showMessage("Grand Cap is elsewhere!", "#94a3b8");
          this.time.delayedCall(1200, () => this.endTurn());
        }
        break;
      }
      case "raid": {
        this.doRaid(playerIdx);
        break;
      }
      case "shop": {
        this.doShop(playerIdx);
        break;
      }
      case "trap": {
        const lost = Math.min(player.coins, Phaser.Math.Between(3, 8));
        player.coins -= lost;
        this.ui.showMessage(`TRAP! -${lost} coins`, "#ff6b35");
        this.time.delayedCall(1200, () => this.endTurn());
        break;
      }
      case "challenge": {
        // Trigger a minigame
        this.time.delayedCall(600, () => this.triggerMinigame());
        break;
      }
      case "capsule": {
        const bonus = Phaser.Math.Between(6, 12);
        player.coins += bonus;
        this.ui.showMessage(`CAPSULE! +${bonus} coins!`, "#8b5cf6");
        this.time.delayedCall(1200, () => this.endTurn());
        break;
      }
      default:
        this.time.delayedCall(600, () => this.endTurn());
    }
  }

  private purchaseGrandCap(playerIdx: number) {
    const player = this.state.players[playerIdx];
    if (player.coins >= 20) {
      player.coins -= 20;
      player.grandCaps++;
      this.ui.showMessage(`★ GRAND CAP! (${player.grandCaps}/${GRAND_CAPS_TO_WIN})`, "#ffd700", 2500);

      // Relocate Grand Cap to a different eligible space
      const eligible = ([] as string[]).concat(
        ...BOARD_SPACES.filter(s => s.grandCapEligible && s.id !== this.state.activeGrandCapId).map(s => [s.id])
      );
      this.state.activeGrandCapId = eligible.length > 0
        ? Phaser.Utils.Array.GetRandom(eligible) as string
        : this.state.activeGrandCapId;

      this.time.delayedCall(500, () => this.drawGrandCap());

      if (player.grandCaps >= GRAND_CAPS_TO_WIN) {
        this.time.delayedCall(2600, () => this.endGame());
      } else {
        this.time.delayedCall(2600, () => this.endTurn());
      }
    } else {
      this.ui.showMessage(`Need 20 coins for Grand Cap (have ${player.coins})`, "#94a3b8");
      this.time.delayedCall(1600, () => this.endTurn());
    }
  }

  private doRaid(playerIdx: number) {
    // Steal coins from richest other player
    const player = this.state.players[playerIdx];
    const others = this.state.players.filter((_, i) => i !== playerIdx);
    const target = others.sort((a, b) => b.coins - a.coins)[0];
    if (!target) { this.endTurn(); return; }

    if (target.hasShield) {
      target.hasShield = false;
      this.ui.showMessage(`RAID blocked by ${target.displayName}'s shield!`, "#94a3b8");
    } else {
      const stolen = Math.min(target.coins, Phaser.Math.Between(4, 10));
      target.coins -= stolen;
      player.coins += stolen;
      this.ui.showMessage(`RAID! Stole ${stolen} coins from ${target.displayName}`, "#ef4444");
    }
    this.time.delayedCall(1600, () => this.endTurn());
  }

  private doShop(playerIdx: number) {
    // Give player a random item (if they have < 2)
    const player = this.state.players[playerIdx];
    const items: import("../GameState").ItemType[] = ["magnet", "golden-spinner", "warp-ticket", "shield"];
    const item = Phaser.Utils.Array.GetRandom(items) as import("../GameState").ItemType;

    if (player.items.length >= 2) {
      // Drop oldest
      player.items.shift();
    }
    player.items.push(item);
    this.ui.showMessage(`Shop: Got ${item}!`, "#f59e0b");
    this.time.delayedCall(1600, () => this.endTurn());
  }

  private triggerMinigame() {
    const types: ("coin-vacuum" | "factory-floor" | "crate-break")[] = ["coin-vacuum", "factory-floor", "crate-break"];
    const type = Phaser.Utils.Array.GetRandom(types) as typeof types[0];
    this.state.minigameType = type;
    this.state.phase = "minigame";

    const sceneKey = type === "coin-vacuum" ? "CoinVacuumScene"
      : type === "factory-floor" ? "FactoryFloorScene"
      : "CrateBreakScene";

    this.scene.pause("BoardScene");
    this.scene.launch(sceneKey, { state: this.state });
  }

  private endTurn() {
    this.emitScoreUpdate();

    // Advance turn
    this.state.turnIndex = (this.state.turnIndex + 1) % this.state.players.length;
    if (this.state.turnIndex === 0) this.state.turnNumber++;

    this.currentPhase = "idle";
    this.time.delayedCall(400, () => this.startTurn());
  }

  private endGame() {
    this.state.phase = "results";
    const ranked = rankPlayers(this.state.players);
    EventBus.emit("phaser:game-over", {
      ranking: ranked.map(p => ({
        id: p.id, displayName: p.displayName, capId: p.capId,
        grandCaps: p.grandCaps, coins: p.coins,
        accuracy: p.totalAnswers > 0 ? p.correctAnswers / p.totalAnswers : 0,
      })),
    });
    this.scene.start("ResultsScene", { ranked });
  }

  private emitScoreUpdate() {
    const scores = this.state.players.map(p => ({
      id: p.id, displayName: p.displayName, capId: p.capId,
      grandCaps: p.grandCaps, coins: p.coins,
      accuracy: p.totalAnswers > 0 ? p.correctAnswers / p.totalAnswers : 0,
    }));
    EventBus.emit("phaser:score-update", scores);
  }

  private currentPlayer(): PlayerState {
    return this.state.players[this.state.turnIndex];
  }

  // Called when returning from a minigame
  onMinigameComplete(rewards: { playerId: string; coins: number }[]) {
    for (const r of rewards) {
      const p = this.state.players.find(x => x.id === r.playerId);
      if (p) p.coins += r.coins;
    }
    this.state.phase = "board";
    this.state.minigameType = null;
    this.scene.resume("BoardScene");
    this.emitScoreUpdate();
    this.time.delayedCall(600, () => this.endTurn());
  }
}
