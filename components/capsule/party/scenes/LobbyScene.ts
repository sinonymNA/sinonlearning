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

// LobbyScene: shows connected players with their cap circles. Host sees "Start Game" button.
// Players can be added live from EventBus until the host fires "party:start".
export class LobbyScene extends Phaser.Scene {
  private players: LobbyPlayer[] = [];
  private playerGroup: Phaser.GameObjects.Container | null = null;
  private isHost = false;
  private maxRounds: 10 | 15 = 10;

  constructor() {
    super({ key: "LobbyScene" });
  }

  init(data: { initialPlayer?: { playerId: string; displayName: string; capId: string }; isHost?: boolean }) {
    this.players = [];
    this.maxRounds = 10;
    this.isHost = !!data.isHost;
    if (data.initialPlayer) {
      this.addPlayer({
        id: data.initialPlayer.playerId,
        displayName: data.initialPlayer.displayName,
        capId: data.initialPlayer.capId,
        colorIndex: 0,
      });
    }
  }

  create() {
    configurePartyCamera(this);
    const W = PARTY_WIDTH;
    const H = PARTY_HEIGHT;

    this.add.image(W / 2, H / 2, "board-bg").setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 0.78).setOrigin(0);
    this.add.rectangle(20, 18, W - 40, H - 36, 0x07142f, 0.82).setStrokeStyle(4, 0x19cdd2).setOrigin(0);

    this.add.text(W / 2, 28, "CAPSULE PARTY â€” LOBBY", {
      fontSize: "26px", fontFamily: "sans-serif", color: "#19cdd2", fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(W / 2, 68, "Players joined:", {
      fontSize: "14px", fontFamily: "sans-serif", color: "#94a3b8",
    }).setOrigin(0.5);

    this.playerGroup = this.add.container(0, 0);
    this.renderPlayers();

    this.add.text(W / 2, H - 136, "MATCH LENGTH", {
      fontSize: "10px", fontFamily: "sans-serif", color: "#94a3b8", fontStyle: "bold",
    }).setOrigin(0.5);
    const tenRounds = this.makeRoundButton(W / 2 - 54, H - 116, "10 ROUNDS");
    const fifteenRounds = this.makeRoundButton(W / 2 + 54, H - 116, "15 ROUNDS");
    const refreshRoundButtons = () => {
      tenRounds.setFillStyle(this.maxRounds === 10 ? 0x19cdd2 : 0x1e293b);
      fifteenRounds.setFillStyle(this.maxRounds === 15 ? 0x19cdd2 : 0x1e293b);
    };
    tenRounds.on("pointerdown", () => { this.maxRounds = 10; refreshRoundButtons(); });
    fifteenRounds.on("pointerdown", () => { this.maxRounds = 15; refreshRoundButtons(); });
    refreshRoundButtons();

    // Fill with bots button (always available for testing)
    const fillBtn = this.add.text(W / 2, H - 90, "[ Fill with Bots ]", {
      fontSize: "15px", fontFamily: "sans-serif", color: "#64748b",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    fillBtn.on("pointerover", () => fillBtn.setColor("#94a3b8"));
    fillBtn.on("pointerout", () => fillBtn.setColor("#64748b"));
    fillBtn.on("pointerdown", () => this.fillWithBots());

    // Start game button (host only or auto for testing)
    const startBtn = this.add.container(W / 2, H - 50);
    const btnBg = this.add.rectangle(0, 0, 200, 40, 0x19cdd2, 1).setOrigin(0.5);
    const btnTxt = this.add.text(0, 0, "START GAME", {
      fontSize: "16px", fontFamily: "sans-serif", color: "#0f172a", fontStyle: "bold",
    }).setOrigin(0.5);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerover", () => btnBg.setFillStyle(0x10e0e8));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x19cdd2));
    btnBg.on("pointerdown", () => this.startGame());
    startBtn.add([btnBg, btnTxt]);

    EventBus.on("party:join", (d) => {
      this.addPlayer({ id: d.playerId, displayName: d.displayName, capId: d.capId, colorIndex: this.players.length });
    });
    EventBus.on("party:start", () => this.startGame());
    EventBus.emit("phaser:phase-change", { phase: "lobby" });
  }

  private addPlayer(p: LobbyPlayer) {
    if (this.players.find(x => x.id === p.id)) return;
    this.players.push(p);
    this.renderPlayers();
  }

  private fillWithBots() {
    const botNames = ["Bolt", "Nova", "Gremlin"];
    for (let i = 0; i < 3 && this.players.length < 4; i++) {
      this.addPlayer({
        id: `bot-${i}`,
        displayName: botNames[i],
        capId: ["cap-astropup", "cap-dragon", "cap-penguin"][i],
        colorIndex: this.players.length,
      });
    }
  }

  private renderPlayers() {
    if (!this.playerGroup) return;
    this.playerGroup.removeAll(true);
    const W = PARTY_WIDTH;
    const cols = 2;
    const slotW = W / 2 - 20;
    const slotH = 70;
    const startY = 100;

    for (let i = 0; i < 4; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 20 + col * (slotW + 20);
      const y = startY + row * (slotH + 10);

      const p = this.players[i];
      const isBot = p && p.id.startsWith("bot-");
      const color = p ? (PLACEHOLDER.PLAYER_COLORS[p.colorIndex] ?? 0x334155) : 0x1e293b;
      const alpha = p ? 1 : 0.3;

      const bg = this.add.rectangle(x, y, slotW, slotH, 0x0b1c3d, alpha * 0.94).setOrigin(0).setStrokeStyle(3, color);
      const nameText = this.add.text(x + slotH + 8, y + 10, p ? p.displayName : "Empty", {
        fontSize: "15px", fontFamily: "sans-serif", color: p ? "#ffffff" : "#475569", fontStyle: p ? "bold" : "normal",
      });
      const subText = this.add.text(x + slotH + 8, y + 32, p ? (isBot ? "ðŸ¤– Bot" : "Player") : "Waiting...", {
        fontSize: "11px", fontFamily: "sans-serif", color: "#94a3b8",
      });

      // Cap circle avatar
      const avatar = this.add.circle(x + slotH / 2, y + slotH / 2, 25, color).setStrokeStyle(3, 0xffffff);
      const avatarText = this.add.text(x + slotH / 2, y + slotH / 2, p ? p.displayName[0].toUpperCase() : "?", {
        fontSize: "18px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
      }).setOrigin(0.5);

      const objects: Phaser.GameObjects.GameObject[] = [bg, avatar, avatarText, nameText, subText];
      if (p) {
        const portraitKey = p.capId;
        if (this.textures.exists(portraitKey)) {
          avatarText.setVisible(false);
          objects.push(this.add.image(x + slotH / 2, y + slotH / 2, portraitKey).setDisplaySize(44, 44));
        }
      }
      this.playerGroup!.add(objects);
    }
  }

  private startGame() {
    if (this.players.length === 0) {
      // Add default player for solo testing
      this.addPlayer({ id: "player-0", displayName: "You", capId: "cap-fox", colorIndex: 0 });
    }
    // Fill remaining slots with bots
    this.fillWithBots();

    const uiScene = this.scene.get("UIScene") as import("./UIScene").UIScene;
    uiScene.scene.start();
    uiScene.initPlayers(
      this.players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        capId: p.capId,
        grandCaps: 0,
        coins: 0,
        colorIndex: p.colorIndex,
      }))
    );

    this.scene.start("BoardScene", { players: this.players, maxRounds: this.maxRounds });
  }

  private makeRoundButton(x: number, y: number, label: string) {
    const button = this.add.rectangle(x, y, 100, 28, 0x1e293b, 1)
      .setStrokeStyle(2, 0x19cdd2)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: "10px", fontFamily: "sans-serif", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5);
    return button;
  }
}

