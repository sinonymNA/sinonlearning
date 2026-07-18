import Phaser from "phaser";
import { creatureById, getNodes, nodeIconKey, pickEncounter } from "../gameState";
import { fitBackground, wildsText } from "../Presentation";
import { getRunSave, setRunSave } from "../save";
import type { WildsNode } from "../types";

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: "MapScene" });
  }

  create() {
    const run = getRunSave();
    if (!run) {
      this.scene.start("TitleScene");
      return;
    }

    fitBackground(this, "verdant-map-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x08121f, 0.16);
    wildsText(this, 120, 70, "VERDANT RIFT", 38).setOrigin(0, 0.5);
    const playerCreature = creatureById(this, run.playerCreature);
    wildsText(this, 120, 120, `${playerCreature.name}  HP ${run.currentHp}/${run.maxHp}  ATK ${run.attack}`, 20, "#d7f7f0").setOrigin(0, 0.5);
    wildsText(this, 120, 160, `Coins ${run.coinsEarned}  Items ${run.items.reduce((sum, item) => sum + item.quantity, 0)}`, 18, "#f6ddb0").setOrigin(0, 0.5);

    const nodes = getNodes(this);
    this.drawPaths(nodes);

    const available = new Set((nodes.find((node) => node.id === run.currentNode)?.next ?? []));
    const completed = new Set(run.completedNodes);

    for (const node of nodes) {
      const key =
        completed.has(node.id) ? "node_completed" :
        node.id === run.currentNode ? "node_current" :
        available.has(node.id) ? nodeIconKey(node.type) :
        "node_locked";

      const button = this.add.image(node.x, node.y, key).setDisplaySize(118, 118);
      const interactive = available.has(node.id);
      if (interactive) {
        button.setInteractive({ useHandCursor: true });
        button.on("pointerover", () => button.setScale(1.06));
        button.on("pointerout", () => button.setScale(1));
        button.on("pointerdown", () => button.setScale(0.96));
        button.on("pointerup", () => this.enterNode(node));
      } else {
        button.setAlpha(completed.has(node.id) || node.id === run.currentNode ? 1 : 0.65);
      }

      if (node.id === run.currentNode) {
        this.add.image(node.x, node.y - 92, "map_player_marker").setDisplaySize(64, 64);
      }
    }

    wildsText(this, 1600, 75, "Choose your next node", 24, "#ffffff").setOrigin(1, 0.5);
  }

  private drawPaths(nodes: WildsNode[]) {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0xbff5ff, 0.38);
    nodes.forEach((node) => {
      node.next.forEach((nextId) => {
        const next = byId.get(nextId);
        if (!next) return;
        graphics.lineBetween(node.x, node.y, next.x, next.y);
      });
    });
  }

  private enterNode(node: WildsNode) {
    const run = getRunSave();
    if (!run) return;
    run.currentNode = node.id;
    setRunSave(run);

    if (node.type === "wild" || node.type === "miniboss" || node.type === "boss") {
      const encounterId = pickEncounter(this, node.type);
      this.scene.start("BattleScene", {
        nodeId: node.id,
        encounterId,
        isBoss: node.type === "boss",
      });
      return;
    }

    let title = node.type.toUpperCase();
    let summary = "Your Wilds press deeper into the ruins.";
    let baseCoins = 12;
    if (node.type === "heal") {
      run.currentHp = Math.min(run.maxHp, run.currentHp + 25);
      summary = "A healing spring restores 25 HP.";
      baseCoins = 6;
    } else if (node.type === "treasure") {
      summary = "You crack open a treasure cache and pocket extra coins.";
      baseCoins = 22;
    } else if (node.type === "shop") {
      summary = "A traveler leaves behind a Power Capsule for your pack.";
      const item = run.items.find((entry) => entry.id === "power_capsule");
      if (item) item.quantity += 1; else run.items.push({ id: "power_capsule", quantity: 1 });
      baseCoins = 8;
    } else if (node.type === "mystery") {
      summary = "A glowing shrine blesses your next capture.";
      run.captureBonus += 0.1;
      baseCoins = 10;
    }
    setRunSave(run);
    this.scene.start("RewardScene", { nodeId: node.id, title, summary, victory: true, baseCoins });
  }
}
