import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PLACEHOLDER } from "../AssetManifest";
import { PARTY_HEIGHT, PARTY_WIDTH, configurePartyCamera } from "../PartyLayout";
import { imageButton, partyText } from "../Presentation";

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
  private roundButtons: Phaser.GameObjects.Image[] = [];

  constructor() { super({ key: "LobbyScene" }); }

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
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 0.38).setOrigin(0);
    this.add.ellipse(W / 2, 285, 760, 330, 0x06152e, 0.48);

    this.add.image(W / 2, 48, "banner-ribbon").setDisplaySize(400, 92);
    partyText(this, W / 2, 39, "PARTY ASSEMBLY", 25, "#ffffff", {
      stroke: "#030b1c", strokeThickness: 4,
    }).setOrigin(0.5);
    partyText(this, W / 2, 101, "FOUR CHALLENGERS  •  ONE GRAND CAP", 10, "#dbeafe", {
      letterSpacing: 1.4,
      stroke: "#020817", strokeThickness: 3,
    }).setOrigin(0.5);

    this.playerGroup = this.add.container(0, 0);
    this.renderPlayers();

    partyText(this, 176, 349, "MATCH LENGTH", 9, "#9fb4d8", { letterSpacing: 2 }).setOrigin(0.5);
    this.roundButtons = [
      this.makeRoundChoice(176, 373, "10 ROUNDS", 10),
      this.makeRoundChoice(176, 407, "15 ROUNDS", 15),
    ];
    this.refreshRoundButtons();

    imageButton(this, 388, 386, "ADD RIVALS", () => this.fillWithBots(), {
      width: 178, height: 58, secondary: true, fontSize: 14,
    });

    imageButton(this, 615, 386, "LAUNCH GAME", () => this.startGame(), {
      width: 250, height: 70, fontSize: 18,
    });

    EventBus.on("party:join", (data) => this.addPlayer({
      id: data.playerId, displayName: data.displayName, capId: data.capId, colorIndex: this.players.length,
    }));
    EventBus.on("party:start", () => this.startGame());
    EventBus.emit("phaser:phase-change", { phase: "lobby" });
  }

  private makeRoundChoice(x: number, y: number, label: string, rounds: 10 | 15) {
    const image = this.add.image(x, y, "button-secondary").setDisplaySize(148, 34).setInteractive({ useHandCursor: true });
    partyText(this, x, y, label, 10, "#ffffff").setOrigin(0.5);
    image.on("pointerdown", () => { this.maxRounds = rounds; this.refreshRoundButtons(); });
    return image;
  }

  private refreshRoundButtons() {
    this.roundButtons.forEach((button, index) => {
      const selected = (index === 0 && this.maxRounds === 10) || (index === 1 && this.maxRounds === 15);
      button.setTexture(selected ? "button-primary" : "button-secondary");
    });
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
        ? this.add.image(x, 183, player.capId).setDisplaySize(104, 104)
        : partyText(this, x, 183, "?", 42, "#64748b").setOrigin(0.5);
      const name = partyText(this, x, 252, player ? player.displayName : "OPEN", 15, player ? "#ffffff" : "#64748b").setOrigin(0.5);
      const role = partyText(this, x, 298, player ? (player.id.startsWith("bot-") ? "RIVAL" : "YOU") : "WAITING", 9, player ? "#dbeafe" : "#475569", {
        letterSpacing: 2,
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

