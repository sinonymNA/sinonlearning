import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";

// UIScene: persistent overlay scene that renders on top of active game scenes.
// Displays HUD elements: turn banner, player coins + grand caps, item slots,
// question panels, minigame timer, and countdown indicators.
// NO React components or Tailwind â€” everything is Phaser GameObjects.

interface UIPlayer {
  id: string;
  displayName: string;
  capId: string;
  grandCaps: number;
  coins: number;
  colorIndex: number;
}

interface QuestionData {
  q: string;
  choices: string[];
  timeLimit: number;
}

interface MinigameIntroData {
  title: string;
  kicker: string;
  objective: string;
  controls: string;
  tip: string;
  accent: number;
}

interface MinigameResultRow {
  name: string;
  score: number;
}

export class UIScene extends Phaser.Scene {
  private playerCards: Phaser.GameObjects.Container[] = [];
  private players: UIPlayer[] = [];
  private turnBanner: Phaser.GameObjects.Container | null = null;
  private questionPanel: Phaser.GameObjects.Container | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private timerRemaining = 0;
  private lastAnswerCallback: ((idx: number) => void) | null = null;
  private answerButtons: Phaser.GameObjects.Container[] = [];
  private itemPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "UIScene", active: false });
  }

  create() {
    configurePartyCamera(this);
    EventBus.on("phaser:score-update", this.onScoreUpdate, this);
  }

  // --- Public API called by other scenes ---

  initPlayers(players: UIPlayer[]) {
    this.players = players;
    this.playerCards.forEach(c => c.destroy());
    this.playerCards = [];
    this.renderPlayerCards();
  }

  showTurnBanner(text: string, sub: string, duration = 3000) {
    if (this.turnBanner) { this.turnBanner.destroy(); this.turnBanner = null; }

    const W = PARTY_WIDTH;
    const bg = this.add.rectangle(0, 0, W, 72, 0x000000, 0.85).setOrigin(0);
    const line = this.add.rectangle(0, 72, W, 3, 0x19cdd2, 1).setOrigin(0);
    const t1 = this.add.text(W / 2, 20, text, {
      fontSize: "22px", fontFamily: "sans-serif", color: "#e2e8f0", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    const t2 = this.add.text(W / 2, 48, sub, {
      fontSize: "14px", fontFamily: "sans-serif", color: "#94a3b8",
    }).setOrigin(0.5, 0);

    this.turnBanner = this.add.container(0, -80, [bg, line, t1, t2]).setDepth(200);
    this.tweens.add({
      targets: this.turnBanner, y: 0, duration: 300, ease: "Back.Out",
    });
    this.time.delayedCall(duration, () => {
      if (!this.turnBanner) return;
      this.tweens.add({
        targets: this.turnBanner, y: -80, duration: 200, ease: "Cubic.In",
        onComplete: () => { this.turnBanner?.destroy(); this.turnBanner = null; },
      });
    });
  }

  showMinigameIntro(data: MinigameIntroData, onReady: () => void) {
    this.playerCards.forEach((card) => card.setVisible(false));
    this.itemPanel?.setVisible(false);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const shade = this.add.rectangle(0, 0, W, H, 0x030712, 0.76).setOrigin(0);
    const panel = this.add.rectangle(W / 2, H / 2, 620, 330, 0x0b1428, 0.98).setStrokeStyle(4, data.accent);
    const kicker = this.add.text(W / 2, 72, data.kicker.toUpperCase(), {
      fontSize: "13px", fontFamily: "sans-serif", color: "#9fb4d8", fontStyle: "bold", letterSpacing: 3,
    }).setOrigin(0.5);
    const title = this.add.text(W / 2, 102, data.title.toUpperCase(), {
      fontSize: "38px", fontFamily: "sans-serif", color: `#${data.accent.toString(16).padStart(6, "0")}`,
      fontStyle: "bold", stroke: "#020617", strokeThickness: 7,
    }).setOrigin(0.5);
    const objectiveLabel = this.add.text(138, 157, "YOUR MISSION", {
      fontSize: "11px", fontFamily: "sans-serif", color: "#7dd3fc", fontStyle: "bold",
    });
    const objective = this.add.text(138, 178, data.objective, {
      fontSize: "19px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold", wordWrap: { width: 520 },
    });
    const controls = this.add.text(138, 222, `CONTROLS  ${data.controls}`, {
      fontSize: "14px", fontFamily: "sans-serif", color: "#dbeafe", backgroundColor: "#172554", padding: { x: 12, y: 9 },
    });
    const tip = this.add.text(138, 271, `TIP  ${data.tip}`, {
      fontSize: "12px", fontFamily: "sans-serif", color: "#a7f3d0",
    });
    const readyBg = this.add.rectangle(W / 2, 337, 210, 48, data.accent, 1).setInteractive({ useHandCursor: true });
    const readyText = this.add.text(W / 2, 337, "I'M READY", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#07111f", fontStyle: "bold",
    }).setOrigin(0.5);
    const container = this.add.container(0, 0, [shade, panel, kicker, title, objectiveLabel, objective, controls, tip, readyBg, readyText])
      .setDepth(1000).setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 250 });
    readyBg.on("pointerover", () => readyBg.setScale(1.04));
    readyBg.on("pointerout", () => readyBg.setScale(1));
    readyBg.once("pointerdown", () => {
      readyBg.disableInteractive();
      this.tweens.add({ targets: container, alpha: 0, duration: 220, onComplete: () => {
        container.destroy();
        onReady();
      }});
    });
  }

  showMinigameResults(title: string, accent: number, rows: MinigameResultRow[], onContinue: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const shade = this.add.rectangle(0, 0, W, H, 0x020617, 0.88).setOrigin(0);
    const panel = this.add.rectangle(W / 2, H / 2, 560, 350, 0x0b1428, 1).setStrokeStyle(4, accent);
    const heading = this.add.text(W / 2, 72, "FINAL RESULTS", {
      fontSize: "13px", fontFamily: "sans-serif", color: "#9fb4d8", fontStyle: "bold", letterSpacing: 3,
    }).setOrigin(0.5);
    const name = this.add.text(W / 2, 105, title.toUpperCase(), {
      fontSize: "28px", fontFamily: "sans-serif", color: `#${accent.toString(16).padStart(6, "0")}`,
      fontStyle: "bold", stroke: "#020617", strokeThickness: 5,
    }).setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [shade, panel, heading, name];
    rows.forEach((row, index) => {
      const y = 157 + index * 45;
      const rowBg = this.add.rectangle(W / 2, y, 460, 36, index === 0 ? accent : 0x17233b, index === 0 ? 0.24 : 0.9)
        .setStrokeStyle(index === 0 ? 2 : 1, index === 0 ? accent : 0x2d3d58);
      const place = this.add.text(188, y, index === 0 ? "1ST" : `${index + 1}${index === 1 ? "ND" : index === 2 ? "RD" : "TH"}`, {
        fontSize: "14px", fontFamily: "sans-serif", color: index === 0 ? "#ffd166" : "#9fb4d8", fontStyle: "bold",
      }).setOrigin(0.5);
      const player = this.add.text(228, y, row.name.slice(0, 14), {
        fontSize: "16px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: index === 0 ? "bold" : "normal",
      }).setOrigin(0, 0.5);
      const score = this.add.text(600, y, `${Math.max(0, row.score)} PTS`, {
        fontSize: "15px", fontFamily: "monospace", color: "#ffd166", fontStyle: "bold",
      }).setOrigin(1, 0.5);
      children.push(rowBg, place, player, score);
    });
    const button = this.add.rectangle(W / 2, 365, 220, 46, accent, 1).setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(W / 2, 365, "BACK TO THE BOARD", {
      fontSize: "15px", fontFamily: "sans-serif", color: "#07111f", fontStyle: "bold",
    }).setOrigin(0.5);
    children.push(button, buttonText);
    const container = this.add.container(0, 0, children).setDepth(1100).setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 250 });
    button.once("pointerdown", () => {
      button.disableInteractive();
      container.destroy();
      onContinue();
    });
  }

  showQuestion(data: QuestionData, onAnswer: (idx: number) => void) {
    if (this.questionPanel) { this.questionPanel.destroy(); this.questionPanel = null; }
    this.answerButtons = [];
    this.lastAnswerCallback = onAnswer;

    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const panelW = Math.min(W - 40, 620);
    const panelH = 280;
    const px = (W - panelW) / 2;
    const py = H / 2 - panelH / 2;

    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0f172a, 0.97).setOrigin(0);
    const border = this.add.rectangle(0, 0, panelW, panelH, 0x19cdd2, 0).setStrokeStyle(2, 0x19cdd2).setOrigin(0);

    const qText = this.add.text(20, 18, data.q, {
      fontSize: "15px", fontFamily: "sans-serif", color: "#e2e8f0", wordWrap: { width: panelW - 40 },
    });

    const labels = ["A", "B", "C", "D"];
    const btnObjs: Phaser.GameObjects.Container[] = [];
    data.choices.forEach((choice, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 16 + col * (panelW / 2);
      const by = 90 + row * 72;
      const bw = panelW / 2 - 24;
      const bh = 60;

      const btnBg = this.add.rectangle(0, 0, bw, bh, 0x1e293b, 1).setOrigin(0).setInteractive({ useHandCursor: true });
      const btnBorder = this.add.rectangle(0, 0, bw, bh, 0x334155, 0).setStrokeStyle(2, 0x334155).setOrigin(0);
      const label = this.add.text(12, 10, labels[i], {
        fontSize: "13px", fontFamily: "sans-serif", color: "#19cdd2", fontStyle: "bold",
      });
      const txt = this.add.text(28, 10, choice, {
        fontSize: "12px", fontFamily: "sans-serif", color: "#e2e8f0",
        wordWrap: { width: bw - 36 }, lineSpacing: 2,
      });

      const btn = this.add.container(bx, by, [btnBg, btnBorder, label, txt]);
      btnBg.on("pointerdown", () => this.handleAnswer(i));
      btnBg.on("pointerover", () => { btnBorder.setStrokeStyle(2, 0x19cdd2); });
      btnBg.on("pointerout", () => { btnBorder.setStrokeStyle(2, 0x334155); });
      btnObjs.push(btn);
      this.answerButtons.push(btn);
    });

    // Timer bar
    const timerBg = this.add.rectangle(16, panelH - 20, panelW - 32, 8, 0x334155, 1).setOrigin(0);
    const timerBar = this.add.rectangle(16, panelH - 20, panelW - 32, 8, 0x19cdd2, 1).setOrigin(0);
    this.tweens.add({
      targets: timerBar, scaleX: 0, duration: data.timeLimit * 1000, ease: "Linear",
      onComplete: () => { if (this.lastAnswerCallback) this.handleAnswer(-1); },
    });

    this.questionPanel = this.add.container(px, py, [bg, border, qText, ...btnObjs, timerBg, timerBar]).setDepth(300);
    this.tweens.add({ targets: this.questionPanel, alpha: { from: 0, to: 1 }, duration: 200 });
  }

  private handleAnswer(idx: number) {
    const cb = this.lastAnswerCallback;
    this.lastAnswerCallback = null;
    if (this.questionPanel) {
      this.tweens.add({
        targets: this.questionPanel, alpha: 0, duration: 200,
        onComplete: () => { this.questionPanel?.destroy(); this.questionPanel = null; },
      });
    }
    if (cb) cb(idx);
  }

  showMinigameTimer(seconds: number) {
    if (this.timerText) { this.timerText.destroy(); this.timerText = null; }
    this.timerEvent?.remove();
    const W = PARTY_WIDTH;
    this.timerText = this.add.text(W / 2, 10, `${seconds}s`, {
      fontSize: "28px", fontFamily: "monospace", color: "#ffd700", fontStyle: "bold",
    }).setOrigin(0.5, 0).setDepth(250);
    this.timerRemaining = seconds;
    this.timerEvent = this.time.addEvent({
      delay: 1000, repeat: seconds - 1, callback: () => {
        this.timerRemaining--;
        if (this.timerText) {
          this.timerText.setText(`${this.timerRemaining}s`);
          if (this.timerRemaining <= 5) this.timerText.setColor("#ef4444");
        }
      },
    });
  }

  hideMinigameTimer() {
    this.timerEvent?.remove();
    this.timerEvent = null;
    this.timerText?.destroy();
    this.timerText = null;
  }

  showMessage(msg: string, color = "#e2e8f0", duration = 2000) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const t = this.add.text(W / 2, H / 2 - 60, msg, {
      fontSize: "20px", fontFamily: "sans-serif", color, fontStyle: "bold",
      backgroundColor: "#0f172a", padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(400).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 200 });
    this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    });
  }

  // Show item inventory for the active human player; onUse called with item index if used
  showItemPanel(items: string[], onUse: (idx: number) => void) {
    if (this.itemPanel) { this.itemPanel.destroy(); this.itemPanel = null; }
    if (items.length === 0) return;

    const W = PARTY_WIDTH;
    const panelW = items.length * 80 + 20;
    const px = W - panelW - 8;
    const py = PARTY_HEIGHT - 120;

    const bg = this.add.rectangle(0, 0, panelW, 66, 0x0f172a, 0.9).setOrigin(0).setStrokeStyle(1, 0x334155);
    const label = this.add.text(8, 4, "ITEMS", { fontSize: "9px", fontFamily: "sans-serif", color: "#64748b" });
    const btns: Phaser.GameObjects.GameObject[] = [bg, label];

    items.forEach((item, i) => {
      const bx = 8 + i * 78;
      const btnBg = this.add.rectangle(bx, 16, 70, 44, 0x1e293b, 1).setOrigin(0).setStrokeStyle(1, 0x334155).setInteractive({ useHandCursor: true });
      const iconKey = `item-${item}`;
      const icon: Phaser.GameObjects.GameObject = this.textures.exists(iconKey)
        ? this.add.image(bx + 20, 38, iconKey).setDisplaySize(34, 34)
        : this.add.text(bx + 8, 20, "?", { fontSize: "16px", fontFamily: "sans-serif" });
      const name = this.add.text(bx + 39, 25, item.replace(/-/g, " ").slice(0, 10), {
        fontSize: "8px", fontFamily: "sans-serif", color: "#94a3b8", wordWrap: { width: 28 },
      });
      btnBg.on("pointerover", () => btnBg.setStrokeStyle(1, 0x19cdd2));
      btnBg.on("pointerout", () => btnBg.setStrokeStyle(1, 0x334155));
      btnBg.on("pointerdown", () => {
        this.itemPanel?.destroy(); this.itemPanel = null;
        onUse(i);
      });
      btns.push(btnBg, icon, name);
    });

    this.itemPanel = this.add.container(px, py, btns).setDepth(160);
  }

  hideItemPanel() {
    this.itemPanel?.destroy();
    this.itemPanel = null;
  }

  private itemIcon(item: string): string {
    const icons: Record<string, string> = {
      magnet: "ðŸ§²", "golden-spinner": "âœ¨", "warp-ticket": "ðŸš€",
      shield: "ðŸ›¡", "raid-block": "ðŸš«",
    };
    return icons[item] ?? "?";
  }

  // --- Private ---

  private renderPlayerCardsLegacy() {
    const W = PARTY_WIDTH;
    const cardW = Math.min(W / 4 - 6, 120);
    const cardH = 52;

    this.players.forEach((p, i) => {
      const x = 4 + i * (cardW + 4);
      const y = PARTY_HEIGHT - cardH - 4;

      const bg = this.add.rectangle(0, 0, cardW, cardH, PLACEHOLDER.PLAYER_COLORS[p.colorIndex] ?? 0x334155, 0.9).setOrigin(0);
      const name = this.add.text(6, 4, p.displayName.slice(0, 10), {
        fontSize: "10px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      });
      const gcLine = this.add.text(6, 18, `â˜… ${p.grandCaps}`, {
        fontSize: "12px", fontFamily: "sans-serif", color: "#ffd700",
      });
      const coinsLine = this.add.text(6, 34, `G ${p.coins}`, {
        fontSize: "11px", fontFamily: "sans-serif", color: "#e2e8f0",
      });

      const container = this.add.container(x, y, [bg, name, gcLine, coinsLine]).setDepth(150);
      this.playerCards.push(container);
    });
  }

  private renderPlayerCards() {
    const cardW = 144;
    const cardH = 56;
    const gap = 5;
    this.players.forEach((player, index) => {
      const x = 8 + index * (cardW + gap);
      const y = PARTY_HEIGHT - cardH - 7;
      const color = PLACEHOLDER.PLAYER_COLORS[player.colorIndex] ?? 0x334155;
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x071426, 0.96).setOrigin(0).setStrokeStyle(3, color);
      const portraitKey = `cap-token-${player.capId.replace(/^cap-/, "")}-${player.colorIndex}`;
      const portrait = this.add.image(28, 28, this.textures.exists(portraitKey) ? portraitKey : `token-${player.colorIndex}`)
        .setDisplaySize(42, 42);
      const name = this.add.text(53, 7, player.displayName.slice(0, 10), {
        fontSize: "12px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      });
      const caps = this.add.text(53, 25, `CAPS ${player.grandCaps}`, {
        fontSize: "10px", fontFamily: "sans-serif", color: "#ffd166", fontStyle: "bold",
      });
      const coins = this.add.text(53, 40, `COINS ${player.coins}`, {
        fontSize: "10px", fontFamily: "sans-serif", color: "#dbeafe",
      });
      this.playerCards.push(this.add.container(x, y, [bg, portrait, name, caps, coins]).setDepth(150));
    });
  }

  showPlayerHud() {
    this.playerCards.forEach((card) => card.setVisible(true));
  }

  private onScoreUpdate(data: import("../EventBus").PlayerScore[]) {
    data.forEach((ps, i) => {
      if (!this.players[i]) return;
      this.players[i].grandCaps = ps.grandCaps;
      this.players[i].coins = ps.coins;
    });
    this.playerCards.forEach(c => c.destroy());
    this.playerCards = [];
    this.renderPlayerCards();
  }
}

