import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { partyText } from "../Presentation";

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
    const plate = this.add.image(W / 2, 51, "banner-ribbon").setDisplaySize(500, 104);
    const t1 = partyText(this, W / 2, 31, text, 22, "#ffffff", {
      stroke: "#020817", strokeThickness: 4,
    }).setOrigin(0.5);
    const t2 = partyText(this, W / 2, 61, sub, 12, "#9fdcf6").setOrigin(0.5);

    this.turnBanner = this.add.container(0, -110, [plate, t1, t2]).setDepth(200);
    this.tweens.add({
      targets: this.turnBanner, y: 0, duration: 300, ease: "Back.Out",
    });
    this.time.delayedCall(duration, () => {
      if (!this.turnBanner) return;
      this.tweens.add({
        targets: this.turnBanner, y: -110, duration: 200, ease: "Cubic.In",
        onComplete: () => { this.turnBanner?.destroy(); this.turnBanner = null; },
      });
    });
  }

  showMinigameIntro(data: MinigameIntroData, onReady: () => void) {
    this.playerCards.forEach((card) => card.setVisible(false));
    this.itemPanel?.setVisible(false);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const shade = this.add.rectangle(0, 0, W, H, 0x030712, 0.66).setOrigin(0);
    const panel = this.add.image(W / 2, H / 2, "panel-briefing").setDisplaySize(640, 365);
    const crest = this.add.image(145, 220, "reward-capsule").setDisplaySize(105, 105);
    const kicker = partyText(this, W / 2, 70, data.kicker.toUpperCase(), 11, "#9fdcf6", {
      letterSpacing: 3,
    }).setOrigin(0.5);
    const title = partyText(this, W / 2, 105, data.title.toUpperCase(), 34, `#${data.accent.toString(16).padStart(6, "0")}`, {
      stroke: "#020617", strokeThickness: 6,
    }).setOrigin(0.5);
    const objectiveLabel = partyText(this, 216, 157, "YOUR MISSION", 10, "#7dd3fc", { letterSpacing: 1.4 });
    const objective = partyText(this, 216, 179, data.objective, 17, "#ffffff", {
      wordWrap: { width: 440 }, lineSpacing: 3,
    });
    const controls = partyText(this, 216, 238, `CONTROLS  ${data.controls}`, 12, "#dbeafe", {
      wordWrap: { width: 440 },
    });
    const tip = partyText(this, 216, 275, `PRO TIP  ${data.tip}`, 11, "#a7f3d0", {
      wordWrap: { width: 440 },
    });
    const readyBg = this.add.image(W / 2, 345, "button-primary").setDisplaySize(230, 58).setInteractive({ useHandCursor: true });
    const readyText = partyText(this, W / 2, 345, "I'M READY", 17, "#07111f").setOrigin(0.5);
    const container = this.add.container(0, 0, [shade, panel, crest, kicker, title, objectiveLabel, objective, controls, tip, readyBg, readyText])
      .setDepth(1000).setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 250 });
    readyBg.on("pointerover", () => { readyBg.setScale(1.04); readyText.setScale(1.04); });
    readyBg.on("pointerout", () => { readyBg.setScale(1); readyText.setScale(1); });
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
    const shade = this.add.rectangle(0, 0, W, H, 0x020617, 0.78).setOrigin(0);
    const panel = this.add.image(W / 2, H / 2, "panel-briefing").setDisplaySize(600, 385);
    const heading = partyText(this, W / 2, 67, "FINAL RESULTS", 11, "#9fdcf6", { letterSpacing: 3 }).setOrigin(0.5);
    const name = partyText(this, W / 2, 101, title.toUpperCase(), 27, `#${accent.toString(16).padStart(6, "0")}`, {
      stroke: "#020617", strokeThickness: 5,
    }).setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [shade, panel, heading, name];
    rows.forEach((row, index) => {
      const y = 157 + index * 45;
      const rowBg = this.add.image(W / 2, y, "hud-player").setDisplaySize(460, 42);
      if (index === 0) rowBg.setTint(0xffe08a);
      const place = partyText(this, 188, y, index === 0 ? "1ST" : `${index + 1}${index === 1 ? "ND" : index === 2 ? "RD" : "TH"}`, 13, index === 0 ? "#ffd166" : "#9fb4d8").setOrigin(0.5);
      const player = partyText(this, 228, y, row.name.slice(0, 14), 15, "#ffffff").setOrigin(0, 0.5);
      const score = partyText(this, 600, y, `${Math.max(0, row.score)} PTS`, 14, "#ffd166").setOrigin(1, 0.5);
      children.push(rowBg, place, player, score);
    });
    const button = this.add.image(W / 2, 365, "button-primary").setDisplaySize(240, 58).setInteractive({ useHandCursor: true });
    const buttonText = partyText(this, W / 2, 365, "BACK TO THE BOARD", 14, "#07111f").setOrigin(0.5);
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
    const shade = this.add.rectangle(0, 0, W, H, 0x020817, 0.67).setOrigin(0);
    const questionGlow = this.add.image(W / 2, 84, "banner-ribbon").setDisplaySize(720, 132);
    const qText = partyText(this, W / 2, 82, data.q, 20, "#ffffff", {
      align: "center", wordWrap: { width: 600 }, stroke: "#020817", strokeThickness: 4,
    }).setOrigin(0.5);

    const labels = ["A", "B", "C", "D"];
    const colors = [0xe5484d, 0x3b82f6, 0xf59e0b, 0x16a34a];
    const btnObjs: Phaser.GameObjects.Container[] = [];
    data.choices.forEach((choice, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 96 + col * 356;
      const by = 160 + row * 90;
      const bw = 348;
      const bh = 72;

      const btnBg = this.add.image(bw / 2, bh / 2, "hud-player").setDisplaySize(bw, bh).setTint(colors[i]).setInteractive({ useHandCursor: true });
      const medallion = this.add.circle(36, bh / 2, 22, 0x07142f, 0.92).setStrokeStyle(2, 0xffffff, 0.7);
      const label = partyText(this, 36, bh / 2, labels[i], 18, "#ffffff").setOrigin(0.5);
      const txt = partyText(this, 70, bh / 2, choice, 14, "#ffffff", {
        wordWrap: { width: bw - 86 }, lineSpacing: 2,
      }).setOrigin(0, 0.5);

      const btn = this.add.container(bx, by, [btnBg, medallion, label, txt]);
      btnBg.on("pointerdown", () => this.handleAnswer(i));
      btnBg.on("pointerover", () => { btn.setScale(1.035); btnBg.setTint(0xffffff); });
      btnBg.on("pointerout", () => { btn.setScale(1); btnBg.setTint(colors[i]); });
      btnObjs.push(btn);
      this.answerButtons.push(btn);
    });

    const timerBg = this.add.rectangle(96, 356, 704, 10, 0x17233b, 1).setOrigin(0);
    const timerBar = this.add.rectangle(96, 356, 704, 10, 0xffd166, 1).setOrigin(0);
    this.tweens.add({
      targets: timerBar, scaleX: 0, duration: data.timeLimit * 1000, ease: "Linear",
      onComplete: () => { if (this.lastAnswerCallback) this.handleAnswer(-1); },
    });

    this.questionPanel = this.add.container(0, 0, [shade, questionGlow, qText, ...btnObjs, timerBg, timerBar]).setDepth(300);
    this.tweens.add({ targets: this.questionPanel, alpha: { from: 0, to: 1 }, duration: 250 });
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
    const lower = msg.toLowerCase();
    const iconKey = lower.includes("correct") ? "reward-correct"
      : lower.includes("trap") || lower.includes("lost") ? "reward-trap"
      : lower.includes("raid") || lower.includes("stole") ? "reward-raid"
      : lower.includes("shield") ? "reward-shield"
      : lower.includes("warp") ? "reward-warp"
      : lower.includes("capsule") ? "reward-capsule"
      : lower.includes("grand cap") ? "reward-grand-cap"
      : lower.includes("coin") ? "reward-coin-stack"
      : null;
    const message = this.add.container(W / 2, H / 2 - 48).setDepth(400).setAlpha(0).setScale(0.88);
    const plate = this.add.image(0, 0, "plaque-reward").setDisplaySize(iconKey ? 440 : 390, 96);
    const icon = iconKey ? this.add.image(-174, 0, iconKey).setDisplaySize(78, 78) : null;
    const t = partyText(this, iconKey ? 22 : 0, 0, msg, 18, "#07142f", {
      align: "center", wordWrap: { width: iconKey ? 330 : 340 },
    }).setOrigin(0.5);
    message.add(icon ? [plate, icon, t] : [plate, t]);
    this.tweens.add({ targets: message, alpha: 1, scale: 1, duration: 220, ease: "Back.Out" });
    this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: message, alpha: 0, y: message.y - 16, duration: 260, onComplete: () => message.destroy() });
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
      magnet: "🧲", "golden-spinner": "✨", "warp-ticket": "🚀",
      shield: "🛡", "raid-block": "🚫",
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

  private renderPlayerCards() {
    const cardH = 62;
    this.players.forEach((player, index) => {
      const x = 8 + index * 198;
      const y = PARTY_HEIGHT - cardH - 7;
      const color = PLACEHOLDER.PLAYER_COLORS[player.colorIndex] ?? 0x334155;
      const glow = this.add.ellipse(91, 33, 190, 58, color, 0.18);
      const frame = this.add.image(91, 31, "hud-player").setDisplaySize(188, 62);
      frame.setTint(color);
      const portraitKey = `cap-token-${player.capId.replace(/^cap-/, "")}-${player.colorIndex}`;
      const portrait = this.add.image(31, 31, this.textures.exists(portraitKey) ? portraitKey : `token-${player.colorIndex}`)
        .setDisplaySize(54, 54);
      const name = partyText(this, 61, 13, player.displayName.slice(0, 10), 11, "#ffffff");
      const capsIcon = this.add.image(64, 40, "reward-grand-cap").setDisplaySize(21, 18);
      const caps = partyText(this, 78, 40, `${player.grandCaps}`, 10, "#ffd166").setOrigin(0, 0.5);
      const coinIcon = this.add.image(117, 40, "reward-coin").setDisplaySize(18, 18);
      const coins = partyText(this, 130, 40, `${player.coins}`, 10, "#dbeafe").setOrigin(0, 0.5);
      this.playerCards.push(this.add.container(x, y, [glow, frame, portrait, name, capsIcon, caps, coinIcon, coins]).setDepth(150));
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

