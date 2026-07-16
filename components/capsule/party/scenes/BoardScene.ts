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

  private tokenTextureKey(p: PlayerState): string {
    const capId = p.capId?.replace(/^cap-/, "") ?? "";
    const key = `cap-token-${capId}-${p.colorIndex}`;
    return this.textures.exists(key) ? key : `token-${p.colorIndex}`;
  }

  private drawTokens() {
    this.tokenObjects.forEach(t => t.destroy());
    this.tokenObjects = [];

    for (let i = 0; i < this.state.players.length; i++) {
      const p = this.state.players[i];
      const space = BOARD_SPACE_MAP.get(p.spaceId);
      if (!space) continue;
      const offset = this.tokenOffset(i, this.state.players.length);
      const texKey = this.tokenTextureKey(p);
      const img = this.add.image(0, 0, texKey);
      const container = this.add.container(space.x + offset.x, space.y + offset.y, [img]).setDepth(10);
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
    const hasItems = !player.isBot && player.items.length > 0;

    this.ui.showTurnBanner(
      `${player.displayName}'s Turn`,
      player.isBot ? "Bot is thinking..." : hasItems ? "Use an item or answer the question!" : "Answer a question to move!",
      1800
    );

    this.time.delayedCall(600, () => {
      if (player.isBot) {
        this.handleBotTurn();
      } else {
        // Show item panel if human has items — they can optionally use one first
        if (player.items.length > 0) {
          this.ui.showItemPanel(player.items, (idx) => {
            this.useItem(this.state.turnIndex, idx);
          });
        }
        this.askQuestion();
      }
    });
  }

  private useItem(playerIdx: number, itemIdx: number) {
    const player = this.state.players[playerIdx];
    const item = player.items[itemIdx];
    if (!item) return;
    player.items.splice(itemIdx, 1);

    switch (item) {
      case "magnet": {
        // Move toward active Grand Cap
        const capSpace = BOARD_SPACE_MAP.get(this.state.activeGrandCapId);
        if (capSpace) {
          this.ui.showMessage("Magnet! Moving toward Grand Cap...", "#19cdd2", 1500);
          // Set player position directly to Grand Cap space (simplified)
          player.spaceId = this.state.activeGrandCapId;
          const token = this.tokenObjects[playerIdx];
          if (token) {
            const offset = this.tokenOffset(playerIdx, this.state.players.length);
            this.tweens.add({ targets: token, x: capSpace.x + offset.x, y: capSpace.y + offset.y, duration: 600 });
          }
        }
        break;
      }
      case "shield":
        player.hasShield = true;
        this.ui.showMessage("Shield activated!", "#19cdd2");
        break;
      case "warp-ticket": {
        // Find nearest warp space and teleport there
        const warpSpaces = BOARD_SPACES.filter(s => s.type === "warp");
        if (warpSpaces.length > 0) {
          const dest = Phaser.Utils.Array.GetRandom(warpSpaces) as typeof warpSpaces[0];
          player.spaceId = dest.id;
          const token = this.tokenObjects[playerIdx];
          if (token) {
            const offset = this.tokenOffset(playerIdx, this.state.players.length);
            this.tweens.add({ targets: token, x: dest.x + offset.x, y: dest.y + offset.y, duration: 400, ease: "Back.Out" });
          }
          this.ui.showMessage(`Warp Ticket! Teleported to ${dest.label ?? dest.id}`, "#ec4899");
        }
        break;
      }
      case "golden-spinner":
        // Flag handled in doSpin
        player.items.push("golden-spinner"); // push back — consumed in doSpin
        this.ui.showMessage("Golden Spinner ready for your roll!", "#ffd700");
        break;
      case "raid-block":
        this.ui.showMessage("Raid Block activated this turn!", "#f59e0b");
        break;
    }
    this.ui.hideItemPanel();
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
    this.moveStep(playerIdx, player.spaceId, steps, []);
  }

  // Walk one step at a time so human can choose at branch points
  private moveStep(playerIdx: number, currentId: string, stepsLeft: number, pathSoFar: string[]) {
    const player = this.state.players[playerIdx];
    if (stepsLeft <= 0) {
      // Done moving
      const fullPath = pathSoFar;
      if (fullPath.length > 0) {
        this.animateAlongPath(playerIdx, fullPath, 0, () => {
          player.spaceId = fullPath[fullPath.length - 1];
          this.onLand(playerIdx);
        });
      } else {
        this.onLand(playerIdx);
      }
      return;
    }

    const space = BOARD_SPACE_MAP.get(currentId);
    if (!space || space.connections.length === 0) {
      // Dead end — animate what we have
      const fullPath = pathSoFar;
      if (fullPath.length > 0) {
        this.animateAlongPath(playerIdx, fullPath, 0, () => {
          player.spaceId = fullPath[fullPath.length - 1];
          this.onLand(playerIdx);
        });
      } else {
        this.onLand(playerIdx);
      }
      return;
    }

    if (space.connections.length > 1 && !player.isBot) {
      // Human at a branch — animate to current space first, then prompt
      if (pathSoFar.length > 0) {
        this.animateAlongPath(playerIdx, pathSoFar, 0, () => {
          player.spaceId = pathSoFar[pathSoFar.length - 1];
          this.promptBranchChoice(space.connections, (chosen) => {
            this.moveStep(playerIdx, chosen, stepsLeft - 1, [chosen]);
          });
        });
      } else {
        this.promptBranchChoice(space.connections, (chosen) => {
          this.moveStep(playerIdx, chosen, stepsLeft - 1, [chosen]);
        });
      }
    } else {
      // Single path or bot: auto-pick first connection
      const nextId = space.connections.length > 1
        ? Phaser.Utils.Array.GetRandom(space.connections) as string
        : space.connections[0];
      this.moveStep(playerIdx, nextId, stepsLeft - 1, [...pathSoFar, nextId]);
    }
  }

  private getPath(fromId: string, count: number): string[] {
    const path: string[] = [];
    let current = fromId;
    for (let i = 0; i < count; i++) {
      const space = BOARD_SPACE_MAP.get(current);
      if (!space || space.connections.length === 0) break;
      // Bots always take first (main loop); human branch prompting is handled in movePlayer
      const nextId = space.connections[0];
      path.push(nextId);
      current = nextId;
    }
    return path;
  }

  // Prompt the human to choose a path at a branch point.
  private promptBranchChoice(connections: string[], onChoice: (id: string) => void) {
    const W = this.scale.width;
    const H = this.scale.height;

    const panel = this.add.container(0, 0).setDepth(400);
    const bg = this.add.rectangle(W / 2, H / 2, 320, 120 + connections.length * 50, 0x0f172a, 0.97).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x19cdd2);
    const title = this.add.text(W / 2, H / 2 - 40, "Choose a path:", {
      fontSize: "16px", fontFamily: "sans-serif", color: "#e2e8f0", fontStyle: "bold",
    }).setOrigin(0.5);
    panel.add([bg, title]);

    const spaceTypeLabel: Record<string, string> = {
      coin: "Coin Space (+G)",
      raid: "Raid Space (steal coins)",
      capsule: "Capsule Space (bonus)",
      shop: "Shop (get item)",
      trap: "Trap (lose coins)",
      challenge: "Challenge (minigame!)",
      warp: "Warp Pad",
      grand_cap: "Grand Cap Pedestal ★",
      start: "Start",
    };

    connections.forEach((id, i) => {
      const space = BOARD_SPACE_MAP.get(id);
      const label = space ? (spaceTypeLabel[space.type] ?? space.type) : id;
      const by = H / 2 - 10 + i * 48;
      const btnBg = this.add.rectangle(W / 2, by, 260, 38, 0x1e293b, 1).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(2, 0x334155);
      const btnTxt = this.add.text(W / 2, by, label, {
        fontSize: "13px", fontFamily: "sans-serif", color: "#e2e8f0",
      }).setOrigin(0.5);
      btnBg.on("pointerover", () => btnBg.setStrokeStyle(2, 0x19cdd2));
      btnBg.on("pointerout", () => btnBg.setStrokeStyle(2, 0x334155));
      btnBg.on("pointerdown", () => {
        panel.destroy();
        onChoice(id);
      });
      panel.add([btnBg, btnTxt]);
    });
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
