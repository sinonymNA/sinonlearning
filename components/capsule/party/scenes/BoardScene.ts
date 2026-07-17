import Phaser from "phaser";
import { BOARD_SPACES, BOARD_SPACE_MAP, GRAND_CAPS_TO_WIN, SPIN_CORRECT_RANGE, SPIN_INCORRECT_RANGE } from "../BoardData";
import { createInitialState, ITEM_DEFS, type GameState, type ItemType, type PlayerState, rankPlayers } from "../GameState";
import { EventBus } from "../EventBus";
import { PLACEHOLDER, SPACE_RADIUS, TOKEN_RADIUS } from "../AssetManifest";
import { getAdaptiveQuestion, recordMastery } from "../QuestionEngine";
import { PARTY_HEIGHT, PARTY_RENDER_SCALE, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { partyText } from "../Presentation";
import type { UIScene } from "./UIScene";
import type { AudioManager } from "../AudioManager";

interface BoardSceneData {
  players: { id: string; displayName: string; capId: string; colorIndex: number }[];
  maxRounds?: 10 | 15;
}

const TWEEN_STEP_DURATION = 360;
const TWEEN_STEP_GAP = 180;

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tokenObjects: Phaser.GameObjects.Container[] = [];
  private grandCapObject: Phaser.GameObjects.Image | null = null;
  private spaceObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private ui!: UIScene;
  private audio: AudioManager | null = null;
  private currentPhase: "question" | "spin" | "move" | "land" | "idle" = "idle";
  private spinDisplay: Phaser.GameObjects.Container | null = null;
  private resumeAfterMinigame: "end-turn" | "start-turn" = "end-turn";

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
    this.state = createInitialState(allPlayers, data.maxRounds ?? 10);
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    this.cameras.main.setOrigin(0.5, 0.5).setBounds(0, 0, W, H);

    if (this.textures.exists("board-bg")) {
      this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H).setDepth(0);
    } else {
      this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 1).setOrigin(0);
    }

    this.ui = this.scene.get("UIScene") as UIScene;
    this.audio = this.registry.get("audio") as AudioManager | null;
    this.scene.bringToTop("UIScene");
    EventBus.emit("phaser:phase-change", { phase: "board" });

    this.drawPaths();
    this.drawSpaces();
    this.drawTokens();
    this.drawGrandCap();
    this.emitScoreUpdate();

    this.time.delayedCall(800, () => this.startTurn());
  }

  private drawPaths() {
    if (this.textures.exists("board-bg")) return;
    const g = this.add.graphics();
    g.lineStyle(3, PLACEHOLDER.PATH_COLOR, 0.8);
    for (const space of BOARD_SPACES) {
      for (const nextId of space.connections) {
        const next = BOARD_SPACE_MAP.get(nextId);
        if (!next) continue;
        g.lineBetween(space.x, space.y, next.x, next.y);
      }
    }
    for (const space of BOARD_SPACES) {
      for (const nextId of space.connections) {
        const next = BOARD_SPACE_MAP.get(nextId);
        if (!next) continue;
        const angle = Phaser.Math.Angle.Between(space.x, space.y, next.x, next.y);
        const mx = (space.x + next.x) / 2;
        const my = (space.y + next.y) / 2;
        g.fillStyle(PLACEHOLDER.PATH_COLOR, 0.8);
        const size = 5;
        const pts = [
          { x: mx + Math.cos(angle) * size, y: my + Math.sin(angle) * size },
          { x: mx + Math.cos(angle + 2.4) * size * 0.6, y: my + Math.sin(angle + 2.4) * size * 0.6 },
          { x: mx + Math.cos(angle - 2.4) * size * 0.6, y: my + Math.sin(angle - 2.4) * size * 0.6 },
        ];
        g.fillTriangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      }
    }
  }

  private drawSpaces() {
    for (const space of BOARD_SPACES) {
      const artKey = space.type === "grand_cap" ? "grand-cap-art" : `space-${space.type}-art`;
      const objects: Phaser.GameObjects.GameObject[] = [];
      if (space.type !== "start") {
        const isCommon = space.type === "coin";
        const halo = this.add.circle(space.x, space.y, isCommon ? 8 : 13, 0x061a43, isCommon ? 0.72 : 0.88)
          .setStrokeStyle(isCommon ? 1 : 2, isCommon ? 0x7dd3fc : 0xffffff, isCommon ? 0.55 : 0.82);
        objects.push(halo);
        if (!isCommon && this.textures.exists(artKey)) {
          objects.push(this.add.image(space.x, space.y, artKey).setDisplaySize(22, 22));
        }
      }
      const container = this.add.container(0, 0, objects);
      this.spaceObjects.set(space.id, container);
    }
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
      const offset = this.tokenOffset(i);
      const img = this.add.image(0, 0, this.tokenTextureKey(p)).setDisplaySize(TOKEN_RADIUS * 2, TOKEN_RADIUS * 2);
      const container = this.add.container(space.x + offset.x, space.y + offset.y, [img]).setDepth(10);
      this.tokenObjects.push(container);
    }
  }

  private tokenOffset(index: number): { x: number; y: number } {
    const offsets = [{ x: -8, y: -8 }, { x: 8, y: -8 }, { x: -8, y: 8 }, { x: 8, y: 8 }];
    return offsets[index % offsets.length];
  }

  private moveTokenToSpace(playerIdx: number, spaceId: string) {
    const token = this.tokenObjects[playerIdx];
    const space = BOARD_SPACE_MAP.get(spaceId);
    if (!token || !space) return;
    const offset = this.tokenOffset(playerIdx);
    this.tweens.add({ targets: token, x: space.x + offset.x, y: space.y + offset.y, duration: 500, ease: "Back.Out" });
  }

  private drawGrandCap() {
    this.grandCapObject?.destroy();
    const space = BOARD_SPACE_MAP.get(this.state.activeGrandCapId);
    if (!space) return;
    const texture = this.textures.exists("grand-cap-art") ? "grand-cap-art" : "grand-cap-pedestal";
    this.grandCapObject = this.add.image(space.x, space.y - SPACE_RADIUS - 14, texture).setDisplaySize(38, 38).setDepth(5);
    this.tweens.add({ targets: this.grandCapObject, y: space.y - SPACE_RADIUS - 20, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }

  // --- Turn flow ---

  private startTurn() {
    if (this.currentPhase !== "idle") return;
    const player = this.currentPlayer();
    const hasItems = !player.isBot && player.items.length > 0;
    this.focusPlayer(this.state.turnIndex, false);
    this.audio?.play("banner");

    this.ui.showTurnBanner(
      `${player.displayName}'s Turn`,
      `Round ${this.state.turnNumber}/${this.state.maxRounds} • ${player.isBot ? "Bot is thinking..." : hasItems ? "Use an item or answer the question!" : "Answer a question to move!"}`,
      2800,
    );

    this.time.delayedCall(player.isBot ? 1500 : 950, () => {
      if (player.isBot) {
        this.handleBotTurn();
      } else {
        if (player.items.length > 0) {
          this.ui.showItemPanel(player.items, (idx) => this.useItem(this.state.turnIndex, idx));
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
        const capSpace = BOARD_SPACE_MAP.get(this.state.activeGrandCapId);
        if (capSpace) {
          this.audio?.play("item-use");
          this.ui.showMessage("Magnet! Moving toward Grand Cap...", "#19cdd2", 1500);
          player.spaceId = this.state.activeGrandCapId;
          const token = this.tokenObjects[playerIdx];
          if (token) {
            const offset = this.tokenOffset(playerIdx);
            this.tweens.add({ targets: token, x: capSpace.x + offset.x, y: capSpace.y + offset.y, duration: 600 });
          }
        }
        break;
      }
      case "shield":
        player.hasShield = true;
        this.audio?.play("item-use");
        this.ui.showMessage("Shield activated!", "#19cdd2");
        break;
      case "warp-ticket": {
        const warpSpaces = BOARD_SPACES.filter(s => s.type === "warp");
        if (warpSpaces.length > 0) {
          const dest = Phaser.Utils.Array.GetRandom(warpSpaces) as typeof warpSpaces[0];
          player.spaceId = dest.id;
          const token = this.tokenObjects[playerIdx];
          if (token) {
            const offset = this.tokenOffset(playerIdx);
            this.tweens.add({ targets: token, x: dest.x + offset.x, y: dest.y + offset.y, duration: 400, ease: "Back.Out" });
          }
          this.audio?.play("warp");
          this.ui.showMessage(`Warp Ticket! Teleported to ${dest.label ?? dest.id}`, "#ec4899");
        }
        break;
      }
      case "golden-spinner":
        player.items.push("golden-spinner");
        this.ui.showMessage("Golden Spinner ready for your roll!", "#ffd700");
        break;
      case "turbo-capsule":
        player.items.push("turbo-capsule");
        this.ui.showMessage("Turbo Capsule armed: +3 movement!", "#19cdd2");
        break;
      case "swap-capsule": {
        const leader = rankPlayers(this.state.players).find(c => c.id !== player.id);
        if (leader) {
          const leaderIndex = this.state.players.indexOf(leader);
          [player.spaceId, leader.spaceId] = [leader.spaceId, player.spaceId];
          this.moveTokenToSpace(playerIdx, player.spaceId);
          this.moveTokenToSpace(leaderIndex, leader.spaceId);
          this.audio?.play("item-use");
          this.ui.showMessage(`Swapped places with ${leader.displayName}!`, "#ff6b6b");
        }
        break;
      }
    }
    this.ui.hideItemPanel();
  }

  private askQuestion() {
    const player = this.currentPlayer();
    const question = getAdaptiveQuestion(player.skillMastery);
    this.currentPhase = "question";

    this.ui.showQuestion(
      { q: `[${question.skill}] ${question.prompt}`, choices: question.choices, timeLimit: 15 },
      (chosenIdx) => {
        const correct = chosenIdx === question.answer;
        player.totalAnswers++;
        if (correct) {
          player.correctAnswers++;
          this.audio?.play("correct");
        } else {
          this.audio?.play("wrong");
        }
        recordMastery(player.skillMastery, question.skill, correct);
        this.ui.showMessage(correct ? "Correct — full spin unlocked!" : question.explanation, correct ? "#63e6be" : "#ffd166", 1100);
        this.time.delayedCall(700, () => this.doSpin(correct));
      },
    );
  }

  private handleBotTurn() {
    const player = this.currentPlayer();
    this.useBotItems(player, this.state.turnIndex);

    const profiles = [
      { accuracy: 0.64, delay: 2400, reaction: "Bolt is choosing an answer..." },
      { accuracy: 0.76, delay: 3000, reaction: "Nova is thinking it through..." },
      { accuracy: 0.58, delay: 2100, reaction: "Gremlin is taking a wild guess..." },
    ];
    const profile = profiles[Math.max(0, player.colorIndex - 1)] ?? profiles[0];
    this.ui.showMessage(profile.reaction, "#9fb4d8", profile.delay - 300);
    this.time.delayedCall(profile.delay, () => {
      const correct = Math.random() < profile.accuracy;
      player.totalAnswers++;
      if (correct) player.correctAnswers++;
      this.doSpin(correct);
    });
  }

  private useBotItems(player: PlayerState, playerIdx: number) {
    const distToGC = this.stepsToGrandCap(player);
    const leader = rankPlayers(this.state.players)[0];
    const isTrailing = leader.grandCaps > player.grandCaps;

    for (let i = player.items.length - 1; i >= 0; i--) {
      const item = player.items[i];
      let shouldUse = false;

      if (item === "magnet" && distToGC >= 5 && player.grandCaps < 1 && Math.random() < 0.4) {
        shouldUse = true;
      } else if (item === "golden-spinner" && distToGC >= 3 && player.grandCaps === 0 && Math.random() < 0.6) {
        shouldUse = true;
      } else if (item === "turbo-capsule" && distToGC >= 2 && distToGC <= 4 && Math.random() < 0.7) {
        shouldUse = true;
      } else if (item === "swap-capsule" && isTrailing && Math.random() < 0.35) {
        shouldUse = true;
      } else if (item === "shield") {
        const threatNearby = this.state.players.some((p, pi) => {
          if (pi === playerIdx) return false;
          return BOARD_SPACE_MAP.get(p.spaceId)?.type === "raid";
        });
        if (threatNearby && Math.random() < 0.9) shouldUse = true;
      }

      if (shouldUse) {
        this.useItem(playerIdx, i);
        break;
      }
    }
  }

  private stepsToGrandCap(player: PlayerState): number {
    let current = player.spaceId;
    for (let i = 0; i < 20; i++) {
      if (current === this.state.activeGrandCapId) return i;
      const space = BOARD_SPACE_MAP.get(current);
      if (!space || space.connections.length === 0) return 99;
      current = space.connections[0];
    }
    return 99;
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
    if (player.items.includes("turbo-capsule")) {
      steps += 3;
      player.items = player.items.filter(i => i !== "turbo-capsule");
    }

    this.showSpinResult(steps, correct, () => this.movePlayer(this.state.turnIndex, steps));
  }

  private showSpinResult(steps: number, correct: boolean, onDone: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    if (this.spinDisplay) { this.spinDisplay.destroy(); this.spinDisplay = null; }

    const plate = this.add.image(0, 0, "plaque-reward").setDisplaySize(330, 126);
    const emblem = this.add.image(-112, 0, correct ? "reward-correct" : "reward-incorrect").setDisplaySize(88, 88);
    const resultTxt = partyText(this, 48, -19, correct ? "FULL POWER!" : "SHORT BOOST", 14, correct ? "#0c6b45" : "#a72c35").setOrigin(0.5);
    const stepsTxt = partyText(this, 48, 17, `MOVE ${steps} SPACE${steps !== 1 ? "S" : ""}`, 21, "#07142f").setOrigin(0.5);

    this.spinDisplay = this.add.container(W / 2, H / 2 - 38, [plate, emblem, resultTxt, stepsTxt]).setDepth(350).setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: this.spinDisplay, alpha: 1, scale: 1, duration: 240, ease: "Back.Out" });

    this.time.delayedCall(1900, () => {
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
    this.focusPlayer(playerIdx, true);
    this.moveStep(playerIdx, player.spaceId, steps, []);
  }

  private moveStep(playerIdx: number, currentId: string, stepsLeft: number, pathSoFar: string[]) {
    const player = this.state.players[playerIdx];
    if (stepsLeft <= 0) {
      if (pathSoFar.length > 0) {
        this.animateAlongPath(playerIdx, pathSoFar, 0, () => {
          player.spaceId = pathSoFar[pathSoFar.length - 1];
          this.onLand(playerIdx);
        });
      } else {
        this.onLand(playerIdx);
      }
      return;
    }

    const space = BOARD_SPACE_MAP.get(currentId);
    if (!space || space.connections.length === 0) {
      if (pathSoFar.length > 0) {
        this.animateAlongPath(playerIdx, pathSoFar, 0, () => {
          player.spaceId = pathSoFar[pathSoFar.length - 1];
          this.onLand(playerIdx);
        });
      } else {
        this.onLand(playerIdx);
      }
      return;
    }

    if (space.connections.length > 1 && !player.isBot) {
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
      const nextId = space.connections.length > 1
        ? Phaser.Utils.Array.GetRandom(space.connections) as string
        : space.connections[0];
      this.moveStep(playerIdx, nextId, stepsLeft - 1, [...pathSoFar, nextId]);
    }
  }

  private promptBranchChoice(connections: string[], onChoice: (id: string) => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const panel = this.add.container(0, 0).setDepth(400);
    const panelHeight = 150 + connections.length * 50;
    const bg = this.add.image(W / 2, H / 2, "panel-briefing").setDisplaySize(390, panelHeight);
    const title = partyText(this, W / 2, H / 2 - 55, "CHOOSE YOUR ROUTE", 17, "#ffffff", {
      stroke: "#020817", strokeThickness: 4,
    }).setOrigin(0.5);
    panel.add([bg, title]);

    const spaceTypeLabel: Record<string, string> = {
      coin: "Coin Space (+G)", raid: "Raid Space (steal coins)", capsule: "Capsule Space (item!)",
      shop: "Shop (pick an item)", trap: "Trap (lose coins)", challenge: "Challenge (minigame!)",
      warp: "Warp Pad", grand_cap: "Grand Cap Pedestal ★", start: "Start",
    };

    connections.forEach((id, i) => {
      const space = BOARD_SPACE_MAP.get(id);
      const label = space ? (spaceTypeLabel[space.type] ?? space.type) : id;
      const by = H / 2 - 10 + i * 48;
      const btnBg = this.add.image(W / 2, by, "button-secondary").setDisplaySize(280, 42).setInteractive({ useHandCursor: true });
      const btnTxt = partyText(this, W / 2, by, label, 12, "#ffffff").setOrigin(0.5);
      btnBg.on("pointerover", () => { btnBg.setScale(1.04); btnTxt.setScale(1.04); });
      btnBg.on("pointerout", () => { btnBg.setScale(1); btnTxt.setScale(1); });
      btnBg.on("pointerdown", () => { panel.destroy(); onChoice(id); });
      panel.add([btnBg, btnTxt]);
    });
  }

  private animateAlongPath(playerIdx: number, path: string[], stepIdx: number, onComplete: () => void) {
    if (stepIdx >= path.length) { onComplete(); return; }
    const token = this.tokenObjects[playerIdx];
    const nextSpace = BOARD_SPACE_MAP.get(path[stepIdx]);
    if (!token || !nextSpace) { onComplete(); return; }

    const offset = this.tokenOffset(playerIdx);
    this.audio?.play("move");
    this.tweens.add({
      targets: token,
      x: nextSpace.x + offset.x,
      y: nextSpace.y + offset.y,
      duration: TWEEN_STEP_DURATION,
      ease: "Cubic.InOut",
      onComplete: () => {
        this.time.delayedCall(TWEEN_STEP_GAP, () => this.animateAlongPath(playerIdx, path, stepIdx + 1, onComplete));
      },
    });
  }

  private onLand(playerIdx: number) {
    this.currentPhase = "land";
    this.cameras.main.stopFollow();
    this.focusPlayer(playerIdx, false);
    const player = this.state.players[playerIdx];
    const space = BOARD_SPACE_MAP.get(player.spaceId);
    if (!space) { this.endTurn(); return; }

    if (space.type === "warp" && space.warpTargetId) {
      const dest = BOARD_SPACE_MAP.get(space.warpTargetId);
      if (dest) {
        this.audio?.play("warp");
        this.ui.showMessage(`WARP! → ${dest.label ?? space.warpTargetId}`, "#ec4899", 1500);
        this.time.delayedCall(400, () => {
          player.spaceId = space.warpTargetId!;
          const token = this.tokenObjects[playerIdx];
          const offset = this.tokenOffset(playerIdx);
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
        this.audio?.play("coin");
        this.ui.showCoinFloat(playerIdx, earned);
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
      case "raid":
        this.doRaid(playerIdx);
        break;
      case "shop":
        this.doShop(playerIdx);
        break;
      case "trap": {
        const lost = Math.min(player.coins, Phaser.Math.Between(3, 8));
        player.coins -= lost;
        this.audio?.play("trap");
        this.ui.showCoinFloat(playerIdx, -lost);
        this.ui.showMessage(`TRAP! -${lost} coins`, "#ff6b35");
        this.time.delayedCall(1200, () => this.endTurn());
        break;
      }
      case "challenge":
        this.time.delayedCall(600, () => this.triggerMinigame("end-turn"));
        break;
      case "capsule": {
        const allItems: ItemType[] = ["magnet", "golden-spinner", "warp-ticket", "shield", "turbo-capsule", "swap-capsule"];
        if (player.items.length < 2) {
          const item = Phaser.Utils.Array.GetRandom(allItems) as ItemType;
          player.items.push(item);
          player.coins += 3;
          this.audio?.play("item-use");
          this.ui.showCoinFloat(playerIdx, 3);
          this.ui.showMessage(`CAPSULE! Got ${ITEM_DEFS[item].name} + 3 coins!`, "#8b5cf6");
        } else {
          player.coins += 8;
          this.audio?.play("coin");
          this.ui.showCoinFloat(playerIdx, 8);
          this.ui.showMessage("CAPSULE! Bag full — +8 coins!", "#8b5cf6");
        }
        this.time.delayedCall(1500, () => this.endTurn());
        break;
      }
      default:
        this.time.delayedCall(600, () => this.endTurn());
    }
  }

  private purchaseGrandCap(playerIdx: number) {
    const player = this.state.players[playerIdx];
    if (player.coins < 20) {
      this.ui.showMessage(`Need 20 coins for Grand Cap (have ${player.coins})`, "#94a3b8");
      this.time.delayedCall(1600, () => this.endTurn());
      return;
    }

    player.coins -= 20;
    player.grandCaps++;
    this.audio?.play("grand-cap");

    const camera = this.cameras.main;
    const token = this.tokenObjects[playerIdx];
    camera.stopFollow();
    if (token) {
      camera.pan(token.x, token.y, 600, Phaser.Math.Easing.Cubic.InOut);
      this.tweens.add({ targets: camera, zoom: 4.0, duration: 600, ease: "Cubic.InOut" });
    }

    // Particle burst at player's space
    const space = BOARD_SPACE_MAP.get(player.spaceId);
    if (space && this.textures.exists("grand-cap-art")) {
      const emitter = this.add.particles(space.x, space.y, "grand-cap-art", {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 900,
        quantity: 3,
        frequency: 60,
      }).setDepth(30);
      this.time.delayedCall(1200, () => emitter.stop());
    }

    this.ui.showMessage(
      `⭐ ${player.displayName} CAPTURED THE GRAND CAP! (${player.grandCaps}/${GRAND_CAPS_TO_WIN})`,
      "#ffd700", 2500,
    );

    // Relocate Grand Cap
    const eligible = BOARD_SPACES.filter(s => s.grandCapEligible && s.id !== this.state.activeGrandCapId).map(s => s.id);
    this.state.activeGrandCapId = eligible.length > 0
      ? Phaser.Utils.Array.GetRandom(eligible) as string
      : this.state.activeGrandCapId;
    this.emitScoreUpdate();

    this.time.delayedCall(2600, () => {
      const newSpace = BOARD_SPACE_MAP.get(this.state.activeGrandCapId);
      if (newSpace) {
        camera.pan(newSpace.x, newSpace.y, 700, Phaser.Math.Easing.Cubic.InOut);
        this.tweens.add({ targets: camera, zoom: PARTY_RENDER_SCALE * 1.3, duration: 700, ease: "Cubic.InOut" });
        this.ui.showMessage("THE GRAND CAP HAS MOVED!", "#ffd700", 1400);
      }

      this.time.delayedCall(600, () => {
        this.drawGrandCap();
        if (this.grandCapObject) {
          this.grandCapObject.setAlpha(0).setScale(0.4);
          this.tweens.add({
            targets: this.grandCapObject, alpha: 1, scale: 1.25, duration: 320, ease: "Back.Out",
            onComplete: () => {
              if (this.grandCapObject) {
                this.tweens.add({ targets: this.grandCapObject, scale: 1, duration: 180 });
              }
            },
          });
        }
      });

      this.time.delayedCall(1800, () => {
        this.tweens.add({ targets: camera, zoom: PARTY_RENDER_SCALE, duration: 400 });
        if (player.grandCaps >= GRAND_CAPS_TO_WIN) {
          this.time.delayedCall(400, () => this.endGame());
        } else {
          this.time.delayedCall(400, () => this.endTurn());
        }
      });
    });
  }

  private doRaid(playerIdx: number) {
    const player = this.state.players[playerIdx];
    const others = this.state.players.filter((_, i) => i !== playerIdx);
    const target = others.sort((a, b) => b.coins - a.coins)[0];
    if (!target) { this.endTurn(); return; }

    if (target.hasShield) {
      target.hasShield = false;
      this.ui.showMessage(`RAID blocked by ${target.displayName}'s shield!`, "#94a3b8");
    } else {
      const stolen = Math.min(target.coins, Phaser.Math.Between(4, 10));
      const targetIdx = this.state.players.indexOf(target);
      target.coins -= stolen;
      player.coins += stolen;
      this.audio?.play("raid");
      this.ui.showCoinFloat(playerIdx, stolen);
      this.ui.showCoinFloat(targetIdx, -stolen);
      this.ui.showMessage(`RAID! Stole ${stolen} coins from ${target.displayName}`, "#ef4444");
    }
    this.time.delayedCall(1600, () => this.endTurn());
  }

  private doShop(playerIdx: number) {
    const player = this.state.players[playerIdx];
    this.audio?.play("shop");
    const allItems: ItemType[] = ["magnet", "golden-spinner", "warp-ticket", "shield", "turbo-capsule", "swap-capsule"];
    const offered = (Phaser.Utils.Array.Shuffle([...allItems]) as ItemType[]).slice(0, 3);

    const giveItem = (item: ItemType) => {
      if (player.items.length >= 2) player.items.shift();
      player.items.push(item);
      this.audio?.play("item-use");
      this.ui.showMessage(`Shop: Got ${ITEM_DEFS[item].name}!`, "#f59e0b");
      this.time.delayedCall(1200, () => this.endTurn());
    };

    if (player.isBot) {
      this.time.delayedCall(1200, () => giveItem(Phaser.Utils.Array.GetRandom(offered) as ItemType));
    } else {
      this.ui.showShopPanel(offered, (item) => giveItem(item));
    }
  }

  private triggerMinigame(resumeAfter: "end-turn" | "start-turn") {
    this.resumeAfterMinigame = resumeAfter;
    const allTypes = ["coin-vacuum", "factory-floor", "crate-break"] as const;
    const candidates = allTypes.filter(t => t !== this.state.lastMinigameKey);
    const type = Phaser.Utils.Array.GetRandom(candidates.length > 0 ? [...candidates] : [...allTypes]) as typeof allTypes[number];
    this.state.lastMinigameKey = type;
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
    this.state.turnIndex = (this.state.turnIndex + 1) % this.state.players.length;
    this.currentPhase = "idle";
    if (this.state.turnIndex === 0) {
      if (this.state.turnNumber >= this.state.maxRounds) {
        this.time.delayedCall(500, () => this.endGame());
        return;
      }
      this.state.turnNumber++;
      this.time.delayedCall(500, () => this.triggerMinigame("start-turn"));
      return;
    }
    this.time.delayedCall(900, () => this.startTurn());
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

  private focusPlayer(playerIndex: number, follow: boolean) {
    const token = this.tokenObjects[playerIndex];
    if (!token) return;
    const camera = this.cameras.main;
    camera.stopFollow();
    if (follow) camera.startFollow(token, false, 0.12, 0.12);
    camera.pan(token.x, token.y, 650, Phaser.Math.Easing.Cubic.InOut);
    this.tweens.add({ targets: camera, zoom: PARTY_RENDER_SCALE * 1.3, duration: 650, ease: "Cubic.InOut" });
  }

  onMinigameComplete(rewards: { playerId: string; coins: number }[]) {
    // Track minigame wins (first entry is 1st place)
    if (rewards.length > 0) {
      const winner = this.state.players.find(p => p.id === rewards[0].playerId);
      if (winner) winner.minigameWins++;
    }

    for (const r of rewards) {
      const p = this.state.players.find(x => x.id === r.playerId);
      if (p) p.coins += r.coins;
    }
    this.state.phase = "board";
    this.state.minigameType = null;
    this.scene.resume("BoardScene");
    this.scene.bringToTop("UIScene");
    this.ui.showPlayerHud();
    this.emitScoreUpdate();

    this.time.delayedCall(400, () => {
      for (const r of rewards) {
        const playerIdx = this.state.players.findIndex(x => x.id === r.playerId);
        if (playerIdx >= 0) this.ui.showCoinFloat(playerIdx, r.coins);
      }
    });

    if (this.resumeAfterMinigame === "start-turn") {
      this.currentPhase = "idle";
      this.time.delayedCall(600, () => this.startTurn());
    } else {
      this.time.delayedCall(600, () => this.endTurn());
    }
  }
}
