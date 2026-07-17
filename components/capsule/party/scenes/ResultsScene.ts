import Phaser from "phaser";
import { type PlayerState } from "../GameState";
import { PLACEHOLDER } from "../AssetManifest";
import { EventBus } from "../EventBus";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { imageButton, partyText } from "../Presentation";
import type { AudioManager } from "../AudioManager";

export class ResultsScene extends Phaser.Scene {
  private audio: AudioManager | null = null;

  constructor() {
    super({ key: "ResultsScene" });
  }

  init(data: { ranked: PlayerState[] }) {
    this.data.set("ranked", data.ranked);
    this.audio = null;
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const ranked = this.data.get("ranked") as PlayerState[];
    this.audio = this.registry.get("audio") as AudioManager | null;

    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 0.82).setOrigin(0);

    this.showBonusAwards(ranked, () => this.showRankings(ranked));

    EventBus.emit("phaser:phase-change", { phase: "results" });
  }

  private computeAwards(ranked: PlayerState[]): Array<{ icon: string; title: string; playerName: string }> {
    if (ranked.length === 0) return [];
    const awards: Array<{ icon: string; title: string; playerName: string }> = [];

    const withAnswers = ranked.filter((p) => p.totalAnswers > 0);
    if (withAnswers.length > 0) {
      const quizWiz = withAnswers.reduce((best, p) =>
        p.correctAnswers / p.totalAnswers > best.correctAnswers / best.totalAnswers ? p : best,
      );
      awards.push({ icon: "⭐", title: "QUIZ WHIZ  —  Best Accuracy", playerName: quizWiz.displayName });
    }

    const topCoin = ranked.reduce((best, p) => (p.coins > best.coins ? p : best));
    if (topCoin.coins > 0) {
      awards.push({ icon: "💰", title: "COIN HOARDER  —  Most Coins", playerName: topCoin.displayName });
    }

    const mvpCandidates = ranked.filter((p) => p.minigameWins > 0);
    if (mvpCandidates.length > 0) {
      const mvp = mvpCandidates.reduce((best, p) => (p.minigameWins > best.minigameWins ? p : best));
      awards.push({ icon: "🏆", title: "MINIGAME MVP  —  Most 1st Places", playerName: mvp.displayName });
    }

    return awards;
  }

  private showBonusAwards(ranked: PlayerState[], onDone: () => void) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const awards = this.computeAwards(ranked);

    if (awards.length === 0) {
      onDone();
      return;
    }

    const heading = this.add.text(W / 2, 26, "BONUS AWARDS", {
      fontFamily: "Nunito, Arial, sans-serif", fontSize: "18px", fontStyle: "bold",
      color: "#19cdd2", stroke: "#07142f", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    let index = 0;
    const showNext = () => {
      if (index >= awards.length) {
        heading.destroy();
        this.time.delayedCall(80, onDone);
        return;
      }
      const award = awards[index++];
      this.audio?.play("grand-cap");

      const container = this.add.container(W / 2, H / 2).setDepth(50).setScale(0.65).setAlpha(0);
      const bg = this.add.image(0, 0, "panel-briefing").setDisplaySize(500, 168);
      const iconText = this.add.text(0, -50, award.icon, { fontSize: "38px", fontFamily: "sans-serif" }).setOrigin(0.5);
      const titleText = this.add.text(0, -6, award.title, {
        fontFamily: "Nunito, Arial, sans-serif", fontSize: "13px", fontStyle: "bold",
        color: "#ffd166", resolution: 2,
      }).setOrigin(0.5);
      const nameText = this.add.text(0, 26, award.playerName, {
        fontFamily: "Nunito, Arial, sans-serif", fontSize: "24px", fontStyle: "bold",
        color: "#ffffff", resolution: 2,
      }).setOrigin(0.5);
      container.add([bg, iconText, titleText, nameText]);

      this.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: "Back.Out",
        onComplete: () => {
          this.time.delayedCall(1800, () => {
            this.tweens.add({
              targets: container,
              alpha: 0,
              scale: 0.85,
              duration: 220,
              onComplete: () => {
                container.destroy();
                this.time.delayedCall(100, showNext);
              },
            });
          });
        },
      });
    };

    showNext();
  }

  private showRankings(ranked: PlayerState[]) {
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    const items: Phaser.GameObjects.GameObject[] = [];

    const title = partyText(this, W / 2, 24, "FINAL STANDINGS", 28, "#ffd700", {
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);
    items.push(title);

    const trophies = ["🥇", "🥈", "🥉", "#4"];
    const medalColors = ["#ffd700", "#c0c0c0", "#cd7f32", "#e2e8f0"];

    ranked.forEach((p, i) => {
      const y = 76 + i * 80;

      const plaque = this.add.image(W / 2, y + 30, "plaque-reward")
        .setDisplaySize(W - 100, 70).setDepth(6).setAlpha(0);
      items.push(plaque);

      const capId = p.capId.replace(/^cap-/, "");
      const tokenKey = `cap-char-${capId}-${p.colorIndex}`;
      const portraitKey = this.textures.exists(tokenKey) ? tokenKey : (this.textures.exists(p.capId) ? p.capId : "");
      if (portraitKey) {
        const portrait = this.add.image(68, y + 30, portraitKey).setDisplaySize(52, 52).setDepth(7).setAlpha(0);
        items.push(portrait);
      }

      const trophyText = this.add.text(100, y + 10, trophies[i] ?? `#${i + 1}`, {
        fontSize: "15px", fontFamily: "sans-serif", color: medalColors[i] ?? "#e2e8f0",
      }).setDepth(7).setAlpha(0);
      items.push(trophyText);

      const nameText = partyText(this, 130, y + 26, p.displayName, 20, "#ffffff").setDepth(7).setAlpha(0);
      items.push(nameText);

      if (i === 0) {
        const winnerLabel = partyText(this, 130, y + 52, "WINNER!", 10, "#ffd700").setDepth(7).setAlpha(0);
        items.push(winnerLabel);
      }

      const acc = p.totalAnswers > 0 ? Math.round((p.correctAnswers / p.totalAnswers) * 100) : 0;
      const statsText = partyText(this, W - 58, y + 10, `★ ${p.grandCaps}   G ${p.coins}   ${acc}% acc`, 11, medalColors[i] ?? "#e2e8f0", { align: "right" })
        .setOrigin(1, 0).setDepth(7).setAlpha(0);
      items.push(statsText);
    });

    const btn = imageButton(this, W / 2, H - 40, "Play Again", () => this.scene.start("TitleScene"), { width: 200, height: 52 });
    btn.setDepth(10).setAlpha(0);
    items.push(btn);

    this.tweens.add({ targets: items, alpha: 1, duration: 400, ease: "Sine.In" });

    // Confetti burst from top-center for 1st place
    this.time.delayedCall(350, () => {
      const emitter = this.add.particles(W / 2, 80, "coin-normal", {
        speed: { min: 80, max: 260 },
        angle: { min: -150, max: -30 },
        scale: { start: 0.55, end: 0 },
        lifespan: 1100,
        quantity: 4,
        frequency: 40,
        tint: [0xffd700, 0xff6b6b, 0x19cdd2, 0xa855f7],
      }).setDepth(15);
      this.time.delayedCall(1800, () => emitter.stop());
    });
  }
}
