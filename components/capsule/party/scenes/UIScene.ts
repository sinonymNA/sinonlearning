import Phaser from "phaser";
import { EventBus, type PlayerScore } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";

// UIScene: persistent overlay scene that renders on top of active game scenes.
// Displays HUD elements: turn banner, player coins + grand caps, item slots,
// question panels, minigame timer, and countdown indicators.
// NO React components or Tailwind — everything is Phaser GameObjects.

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

export class UIScene extends Phaser.Scene {
  private playerCards: Phaser.GameObjects.Container[] = [];
  private players: UIPlayer[] = [];
  private turnBanner: Phaser.GameObjects.Container | null = null;
  private questionPanel: Phaser.GameObjects.Container | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private timerTween: Phaser.Tweens.Tween | null = null;
  private timerRemaining = 0;
  private lastAnswerCallback: ((idx: number) => void) | null = null;
  private answerButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "UIScene", active: false });
  }

  create() {
    EventBus.on("phaser:score-update", this.onScoreUpdate, this);
  }

  // --- Public API called by other scenes ---

  initPlayers(players: UIPlayer[]) {
    this.players = players;
    this.playerCards.forEach(c => c.destroy());
    this.playerCards = [];
    this.renderPlayerCards();
  }

  showTurnBanner(text: string, sub: string, duration = 2200) {
    if (this.turnBanner) { this.turnBanner.destroy(); this.turnBanner = null; }

    const W = this.scale.width;
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

  showQuestion(data: QuestionData, onAnswer: (idx: number) => void) {
    if (this.questionPanel) { this.questionPanel.destroy(); this.questionPanel = null; }
    this.answerButtons = [];
    this.lastAnswerCallback = onAnswer;

    const W = this.scale.width;
    const H = this.scale.height;
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
      btnBg.on("pointerdown", () => this.handleAnswer(i, data.choices.length));
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
      onComplete: () => { if (this.lastAnswerCallback) this.handleAnswer(-1, data.choices.length); },
    });

    this.questionPanel = this.add.container(px, py, [bg, border, qText, ...btnObjs, timerBg, timerBar]).setDepth(300);
    this.tweens.add({ targets: this.questionPanel, alpha: { from: 0, to: 1 }, duration: 200 });
  }

  private handleAnswer(idx: number, _total: number) {
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
    const W = this.scale.width;
    this.timerText = this.add.text(W / 2, 10, `${seconds}s`, {
      fontSize: "28px", fontFamily: "monospace", color: "#ffd700", fontStyle: "bold",
    }).setOrigin(0.5, 0).setDepth(250);
    this.timerRemaining = seconds;
    this.time.addEvent({
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
    this.timerText?.destroy();
    this.timerText = null;
  }

  showMessage(msg: string, color = "#e2e8f0", duration = 2000) {
    const W = this.scale.width;
    const H = this.scale.height;
    const t = this.add.text(W / 2, H / 2 - 60, msg, {
      fontSize: "20px", fontFamily: "sans-serif", color, fontStyle: "bold",
      backgroundColor: "#0f172a", padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(400).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 200 });
    this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    });
  }

  // --- Private ---

  private renderPlayerCards() {
    const W = this.scale.width;
    const cardW = Math.min(W / 4 - 6, 120);
    const cardH = 52;

    this.players.forEach((p, i) => {
      const x = 4 + i * (cardW + 4);
      const y = this.scale.height - cardH - 4;

      const bg = this.add.rectangle(0, 0, cardW, cardH, PLACEHOLDER.PLAYER_COLORS[p.colorIndex] ?? 0x334155, 0.9).setOrigin(0);
      const name = this.add.text(6, 4, p.displayName.slice(0, 10), {
        fontSize: "10px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      });
      const gcLine = this.add.text(6, 18, `★ ${p.grandCaps}`, {
        fontSize: "12px", fontFamily: "sans-serif", color: "#ffd700",
      });
      const coinsLine = this.add.text(6, 34, `G ${p.coins}`, {
        fontSize: "11px", fontFamily: "sans-serif", color: "#e2e8f0",
      });

      const container = this.add.container(x, y, [bg, name, gcLine, coinsLine]).setDepth(150);
      this.playerCards.push(container);
    });
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
