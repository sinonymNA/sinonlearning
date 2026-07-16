import Phaser from "phaser";
import { PLACEHOLDER, SPACE_RADIUS, TOKEN_RADIUS, COIN_RADIUS, PLAYER_RADIUS } from "../AssetManifest";

// BootScene: generates all placeholder textures programmatically, then starts TitleScene
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Nothing to load — all assets are procedural
  }

  create() {
    this.generateTextures();
    this.scene.start("TitleScene");
  }

  private starPolygon(cx: number, cy: number, points: number, outerR: number, innerR: number, startAngle: number): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push(new Phaser.Geom.Point(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r));
    }
    return pts;
  }

  private generateTextures() {
    const g = this.add.graphics();

    // Board space shapes
    const spaceTypes: [string, number][] = [
      ["space-coin", PLACEHOLDER.SPACE_COIN],
      ["space-raid", PLACEHOLDER.SPACE_RAID],
      ["space-capsule", PLACEHOLDER.SPACE_CAPSULE],
      ["space-shop", PLACEHOLDER.SPACE_SHOP],
      ["space-trap", PLACEHOLDER.SPACE_TRAP],
      ["space-challenge", PLACEHOLDER.SPACE_CHALLENGE],
      ["space-warp", PLACEHOLDER.SPACE_WARP],
      ["space-grand_cap", PLACEHOLDER.SPACE_GRAND_CAP],
      ["space-start", PLACEHOLDER.SPACE_START],
    ];

    for (const [key, color] of spaceTypes) {
      g.clear();
      g.fillStyle(color, 1);
      g.fillCircle(SPACE_RADIUS, SPACE_RADIUS, SPACE_RADIUS);
      g.lineStyle(3, 0xffffff, 0.5);
      g.strokeCircle(SPACE_RADIUS, SPACE_RADIUS, SPACE_RADIUS);
      g.generateTexture(key, SPACE_RADIUS * 2, SPACE_RADIUS * 2);
    }

    // Player token textures (one per player slot)
    for (let i = 0; i < 4; i++) {
      g.clear();
      g.fillStyle(PLACEHOLDER.PLAYER_COLORS[i], 1);
      g.fillCircle(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_RADIUS);
      g.lineStyle(2, 0xffffff, 0.9);
      g.strokeCircle(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_RADIUS);
      g.generateTexture(`token-${i}`, TOKEN_RADIUS * 2, TOKEN_RADIUS * 2);
    }

    // Minigame player characters
    for (let i = 0; i < 4; i++) {
      g.clear();
      g.fillStyle(PLACEHOLDER.PLAYER_COLORS[i], 1);
      g.fillCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS);
      // Eye dot
      g.fillStyle(0xffffff, 1);
      g.fillCircle(PLAYER_RADIUS + 5, PLAYER_RADIUS - 4, 4);
      g.fillStyle(0x000000, 1);
      g.fillCircle(PLAYER_RADIUS + 6, PLAYER_RADIUS - 4, 2);
      g.generateTexture(`player-${i}`, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
    }

    // Coin textures
    g.clear();
    g.fillStyle(PLACEHOLDER.COIN_COLOR, 1);
    g.fillCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS);
    g.lineStyle(2, 0xffa500, 1);
    g.strokeCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS);
    g.generateTexture("coin-normal", COIN_RADIUS * 2, COIN_RADIUS * 2);

    g.clear();
    g.fillStyle(PLACEHOLDER.COIN_BONUS_COLOR, 1);
    g.fillCircle(COIN_RADIUS + 3, COIN_RADIUS + 3, COIN_RADIUS + 3);
    g.lineStyle(2, 0x00cccc, 1);
    g.strokeCircle(COIN_RADIUS + 3, COIN_RADIUS + 3, COIN_RADIUS + 3);
    g.generateTexture("coin-bonus", (COIN_RADIUS + 3) * 2, (COIN_RADIUS + 3) * 2);

    g.clear();
    g.fillStyle(PLACEHOLDER.COIN_FAKE_COLOR, 1);
    g.fillCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS);
    g.lineStyle(2, 0xcc0000, 1);
    g.strokeCircle(COIN_RADIUS, COIN_RADIUS, COIN_RADIUS);
    // X mark
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(COIN_RADIUS - 4, COIN_RADIUS - 4, COIN_RADIUS + 4, COIN_RADIUS + 4);
    g.lineBetween(COIN_RADIUS + 4, COIN_RADIUS - 4, COIN_RADIUS - 4, COIN_RADIUS + 4);
    g.generateTexture("coin-fake", COIN_RADIUS * 2, COIN_RADIUS * 2);

    // Magnet pulse ring
    g.clear();
    g.lineStyle(4, 0x00ffff, 0.7);
    g.strokeCircle(60, 60, 56);
    g.generateTexture("magnet-pulse", 120, 120);

    // Board path segment (drawn as thin rectangle)
    g.clear();
    g.fillStyle(PLACEHOLDER.PATH_COLOR, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture("path-dot", 4, 4);

    // Grand Cap pedestal — 5-pointed star drawn as polygon
    g.clear();
    g.fillStyle(PLACEHOLDER.SPACE_GRAND_CAP, 1);
    const starPoints = this.starPolygon(24, 24, 5, 22, 10, -Math.PI / 2);
    g.fillPoints(starPoints, true);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokePoints(starPoints, true);
    g.generateTexture("grand-cap-pedestal", 48, 48);

    g.destroy();
  }
}
