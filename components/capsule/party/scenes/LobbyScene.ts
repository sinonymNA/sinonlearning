import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";

interface LobbyPlayer {
  id: string;
  displayName: string;
  capId: string;
  colorIndex: number;
}

export class LobbyScene extends Phaser.Scene {
  private players: LobbyPlayer[] = [];
  private playerGroup: Phaser.GameObjects.Container | null = null;
  private maxRounds: 10 | 15 = 10;

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data: { initialPlayer?: { playerId: string; displayName: string; capId: string } }) {
    this.players = [];
    this.maxRounds = 10;
    if (data.initialPlayer) {
      this.addPlayer({ id: data.initialPlayer.playerId, displayName: data.initialPlayer.displayName, capId: data.initialPlayer.capId, colorIndex: 0 });
    }
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;
    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W * 1.08, H * 1.08);
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 0.48).setOrigin(0);
    this.add.ellipse(W / 2, 300, 760, 330, 0x06152e, 0.64);

    this.add.text(W / 2, 32, "PARTY ASSEMBLY", {
      fontSize: "30px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      stroke: "#07142f", strokeThickness: 7,
    }).setOrigin(0.5);
    this.add.text(W / 2, 66, "Four challengers. One Grand Cap.", {
      fontSize: "13px", fontFamily: "sans-serif", color: "#9fb4d8",
    }).setOrigin(0.5);

    this.playerGroup = this.add.container(0, 0);
    this.renderPlayers();

    const consoleGlow = this.add.ellipse(W / 2, 392, 440, 70, 0x19cdd2, 0.12);
    this.tweens.add({ targets: consoleGlow, scaleX: 1.08, alpha: 0.05, duration: 1200, yoyo: true, repeat: -1 });

    this.add.text(220, 348, "MATCH", { fontSize: "10px", color: "#9fb4d8", fontStyle: "bold", letterSpacing: 2 }).setOrigin(0.5);
    const ten = this.makePill(220, 373, "10 ROUNDS", true);
    const fifteen = this.makePill(220, 407, "15 ROUNDS", false);
    const refresh = () => {
      ten.setFillStyle(this.maxRounds === 10 ? 0xffd166 : 0x17233b);
      fifteen.setFillStyle(this.maxRounds === 15 ? 0xffd166 : 0x17233b);
    };
    ten.on("pointerdown", () => { this.maxRounds = 10; refresh(); });
    fifteen.on("pointerdown", () => { this.maxRounds = 15; refresh(); });

    const rivalButton = this.add.container(395, 373);
    const rivalPlate = this.add.ellipse(0, 0, 154, 42, 0x17233b, 1).setStrokeStyle(2, 0x7dd3fc, 0.7);
    const rivalHit = this.add.zone(0, 0, 154, 42).setInteractive({ useHandCursor: true });
    const rivalText = this.add.text(0, 0, "ADD RIVALS", {
      fontSize: "13px", fontFamily: "sans-serif", color: "#dbeafe", fontStyle: "bold",
    }).setOrigin(0.5);
    rivalButton.add([rivalPlate, rivalHit, rivalText]);
    rivalHit.on("pointerover", () => rivalButton.setScale(1.05));
    rivalHit.on("pointerout", () => rivalButton.setScale(1));
    rivalHit.on("pointerdown", () => this.fillWithBots());

    const launch = this.add.container(590, 389);
    const launchGlow = this.add.ellipse(0, 5, 250, 68, 0xffd166, 0.18);
    const launchPlate = this.add.graphics().fillStyle(0x19cdd2, 1).fillRoundedRect(-112, -28, 224, 56, 28);
    const launchHit = this.add.zone(0, 0, 224, 56).setInteractive({ useHandCursor: true });
    const launchText = this.add.text(0, 0, "LAUNCH GAME", {
      fontSize: "17px", fontFamily: "sans-serif", color: "#07142f", fontStyle: "bold",
    }).setOrigin(0.5);
    launch.add([launchGlow, launchPlate, launchHit, launchText]);
    launchHit.on("pointerover", () => launch.setScale(1.05));
    launchHit.on("pointerout", () => launch.setScale(1));
    launchHit.on("pointerdown", () => this.startGame());

    EventBus.on("party:join", (data) => this.addPlayer({
      id: data.playerId, displayName: data.displayName, capId: data.capId, colorIndex: this.players.length,
    }));
    EventBus.on("party:start", () => this.startGame());
    EventBus.emit("phaser:phase-change", { phase: "lobby" });
  }

  private makePill(x: number, y: number, label: string, selected: boolean) {
    const pill = this.add.ellipse(x, y, 132, 28, selected ? 0xffd166 : 0x17233b, 1)
      .setStrokeStyle(2, 0xffffff, 0.35).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: "10px", fontFamily: "sans-serif", color: selected ? "#07142f" : "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5);
    return pill;
  }

  private addPlayer(player: LobbyPlayer) {
    if (this.players.some((candidate) => candidate.id === player.id)) return;
    this.players.push(player);
    this.renderPlayers();
  }

  private fillWithBots() {
    const bots = [
      { id: "bot-0", displayName: "Bolt", capId: "cap-astropup" },
      { id: "bot-1", displayName: "Nova", capId: "cap-dragon" },
      { id: "bot-2", displayName: "Gremlin", capId: "cap-penguin" },
    ];
    for (const bot of bots) {
      if (this.players.length >= 4) break;
      this.addPlayer({ ...bot, colorIndex: this.players.length });
    }
  }

  private renderPlayers() {
    if (!this.playerGroup) return;
    this.playerGroup.removeAll(true);
    const xs = [145, 315, 485, 655];
    for (let index = 0; index < 4; index++) {
      const player = this.players[index];
      const color = player ? (PLACEHOLDER.PLAYER_COLORS[player.colorIndex] ?? 0x334155) : 0x475569;
      const x = xs[index];
      const pedestal = this.add.ellipse(x, 278, 132, 35, color, player ? 0.55 : 0.18).setStrokeStyle(3, color, 0.9);
      const halo = this.add.circle(x, 183, 61, color, player ? 0.18 : 0.06).setStrokeStyle(3, color, player ? 0.9 : 0.3);
      const portrait = player
        ? this.add.image(x, 183, player.capId).setDisplaySize(96, 96)
        : this.add.text(x, 183, "?", { fontSize: "42px", color: "#64748b", fontStyle: "bold" }).setOrigin(0.5);
      const name = this.add.text(x, 252, player ? player.displayName : "OPEN", {
        fontSize: "15px", fontFamily: "sans-serif", color: player ? "#ffffff" : "#64748b", fontStyle: "bold",
      }).setOrigin(0.5);
      const role = this.add.text(x, 297, player ? (player.id.startsWith("bot-") ? "RIVAL" : "YOU") : "WAITING", {
        fontSize: "9px", fontFamily: "sans-serif", color: player ? "#dbeafe" : "#475569", fontStyle: "bold", letterSpacing: 2,
      }).setOrigin(0.5);
      this.playerGroup.add([pedestal, halo, portrait, name, role]);
    }
  }

  private startGame() {
    if (this.players.length === 0) this.addPlayer({ id: "player-0", displayName: "You", capId: "cap-fox", colorIndex: 0 });
    this.fillWithBots();
    const ui = this.scene.get("UIScene") as import("./UIScene").UIScene;
    ui.scene.start();
    ui.initPlayers(this.players.map((player) => ({
      id: player.id, displayName: player.displayName, capId: player.capId,
      grandCaps: 0, coins: 0, colorIndex: player.colorIndex,
    })));
    this.scene.start("BoardScene", { players: this.players, maxRounds: this.maxRounds });
  }
}

