import Phaser from "phaser";
import { PLACEHOLDER, SPACE_RADIUS, TOKEN_RADIUS, COIN_RADIUS, PLAYER_RADIUS } from "../AssetManifest";

// Cap IDs whose portrait images live at /assets/capsule/caps/cap-{id}.png
export const KNOWN_CAP_IDS = [
  "astropup","bear","brrbrr","bunny","burbaloni","butterfly","cappasino","cappuccina",
  "cat","chimpanzini","cometfox","crown","crystal","dog","dragon","duck","eagle",
  "fish","flamingo","fox","frog","ghost","lion","monkey","mouse","owl","panda",
  "parrot","penguin","phoenix","rabbit","shark","shrimp","sloth","snake","turtle",
  "unicorn","wolf",
];

// BootScene: loads cap portrait images + generates placeholder textures, then starts TitleScene.
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Load portrait images for the caps we know about
    for (const id of KNOWN_CAP_IDS) {
      this.load.image(`cap-${id}`, `/assets/capsule/caps/cap-${id}.png`);
    }
    // Loading bar
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(0, 0, W, H, PLACEHOLDER.BOARD_BG, 1).setOrigin(0);
    const bar = this.add.rectangle(W / 2 - 120, H / 2, 0, 8, 0x19cdd2, 1).setOrigin(0, 0.5);
    this.add.rectangle(W / 2 - 120, H / 2, 240, 8, 0x1e293b, 1).setOrigin(0, 0.5);
    this.load.on("progress", (v: number) => { bar.width = 240 * v; });
  }

  create() {
    this.generateTextures();
    this.capMaskedTokens();
    this.scene.start("TitleScene");
  }

  // Build circular-masked cap portrait textures: "cap-token-{capId}-{colorIndex}"
  private capMaskedTokens() {
    const R = TOKEN_RADIUS;
    const D = R * 2;
    const PR = PLAYER_RADIUS;
    const PD = PR * 2;

    // For each known cap, build a board token texture and a minigame character texture
    for (const id of KNOWN_CAP_IDS) {
      if (!this.textures.exists(`cap-${id}`)) continue;
      for (let ci = 0; ci < 4; ci++) {
        const borderColor = PLACEHOLDER.PLAYER_COLORS[ci] ?? 0x888888;

        // --- Board token (TOKEN_RADIUS) ---
        const tokenKey = `cap-token-${id}-${ci}`;
        const rt = this.add.renderTexture(0, 0, D, D).setVisible(false);
        // Draw border ring
        const g = this.add.graphics().setVisible(false);
        g.fillStyle(borderColor, 1);
        g.fillCircle(R, R, R);
        rt.draw(g, 0, 0);
        // Draw portrait clipped to circle: draw image then mask
        const portrait = this.add.image(R, R, `cap-${id}`).setDisplaySize(D - 4, D - 4).setVisible(false);
        const maskGraphics = this.add.graphics().setVisible(false);
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillCircle(R, R, R - 3);
        const mask = maskGraphics.createGeometryMask();
        portrait.setMask(mask);
        rt.draw(portrait, 0, 0);
        portrait.clearMask(true);
        portrait.destroy();
        maskGraphics.destroy();
        g.destroy();
        rt.saveTexture(tokenKey);
        rt.destroy();

        // --- Minigame character (PLAYER_RADIUS) ---
        const charKey = `cap-char-${id}-${ci}`;
        const rt2 = this.add.renderTexture(0, 0, PD, PD).setVisible(false);
        const g2 = this.add.graphics().setVisible(false);
        g2.fillStyle(borderColor, 1);
        g2.fillCircle(PR, PR, PR);
        rt2.draw(g2, 0, 0);
        const portrait2 = this.add.image(PR, PR, `cap-${id}`).setDisplaySize(PD - 6, PD - 6).setVisible(false);
        const mg2 = this.add.graphics().setVisible(false);
        mg2.fillStyle(0xffffff);
        mg2.fillCircle(PR, PR, PR - 3);
        const mask2 = mg2.createGeometryMask();
        portrait2.setMask(mask2);
        rt2.draw(portrait2, 0, 0);
        portrait2.clearMask(true);
        portrait2.destroy();
        mg2.destroy();
        g2.destroy();
        rt2.saveTexture(charKey);
        rt2.destroy();
      }
    }
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

    // Fallback player token textures (used when cap portrait not loaded)
    for (let i = 0; i < 4; i++) {
      g.clear();
      g.fillStyle(PLACEHOLDER.PLAYER_COLORS[i], 1);
      g.fillCircle(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_RADIUS);
      g.lineStyle(2, 0xffffff, 0.9);
      g.strokeCircle(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_RADIUS);
      g.generateTexture(`token-${i}`, TOKEN_RADIUS * 2, TOKEN_RADIUS * 2);
    }

    // Fallback minigame player characters
    for (let i = 0; i < 4; i++) {
      g.clear();
      g.fillStyle(PLACEHOLDER.PLAYER_COLORS[i], 1);
      g.fillCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS);
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
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(COIN_RADIUS - 4, COIN_RADIUS - 4, COIN_RADIUS + 4, COIN_RADIUS + 4);
    g.lineBetween(COIN_RADIUS + 4, COIN_RADIUS - 4, COIN_RADIUS - 4, COIN_RADIUS + 4);
    g.generateTexture("coin-fake", COIN_RADIUS * 2, COIN_RADIUS * 2);

    // Magnet pulse ring
    g.clear();
    g.lineStyle(4, 0x00ffff, 0.7);
    g.strokeCircle(60, 60, 56);
    g.generateTexture("magnet-pulse", 120, 120);

    // Grand Cap pedestal — 5-pointed star
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
