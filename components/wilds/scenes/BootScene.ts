import Phaser from "phaser";
import { REGISTRY_KEYS, WILDS_HEIGHT, WILDS_WIDTH } from "../gameState";
import { ACTIVE_REGION, type WildsRegionManifest } from "../regions";
import { WildsAudioManager } from "../WildsAudio";

type CropRect = { x: number; y: number; width: number; height: number };

const TITLE_BUTTONS: Record<string, CropRect> = {
  btn_primary: { x: 34, y: 180, width: 582, height: 272 },
  btn_secondary: { x: 654, y: 180, width: 590, height: 272 },
  btn_purple: { x: 34, y: 498, width: 582, height: 272 },
  btn_gold: { x: 654, y: 498, width: 590, height: 272 },
};

const BATTLE_UI: Record<string, CropRect> = {
  battle_hp_player_frame: { x: 30, y: 30, width: 605, height: 200 },
  battle_hp_enemy_frame: { x: 650, y: 30, width: 600, height: 200 },
  battle_question_panel: { x: 70, y: 230, width: 1140, height: 280 },
  battle_answer_button_green: { x: 30, y: 525, width: 300, height: 145 },
  battle_answer_button_blue: { x: 340, y: 525, width: 295, height: 145 },
  battle_answer_button_purple: { x: 645, y: 525, width: 295, height: 145 },
  battle_answer_button_gold: { x: 940, y: 525, width: 300, height: 145 },
  battle_backpack_icon: { x: 20, y: 730, width: 150, height: 150 },
  battle_item_panel: { x: 250, y: 730, width: 420, height: 190 },
  battle_reward_panel: { x: 720, y: 730, width: 480, height: 190 },
};

const RESULTS_UI: Record<string, CropRect> = {
  results_reward_panel: { x: 90, y: 55, width: 680, height: 355 },
  results_continue_button: { x: 60, y: 530, width: 335, height: 96 },
  results_summary_panel: { x: 405, y: 450, width: 360, height: 360 },
  results_victory_badge: { x: 65, y: 825, width: 350, height: 190 },
  results_defeat_badge: { x: 425, y: 825, width: 350, height: 190 },
};

export class BootScene extends Phaser.Scene {
  constructor(private readonly equippedCapId = "cap-fox", private readonly region: WildsRegionManifest = ACTIVE_REGION) {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("wilds_logo", "/assets/wilds/logos/wilds_logo_transparent.png");
    this.load.image("title-buttons-sheet", "/assets/wilds/ui/title_buttons_sheet.png");
    this.load.image("battle-ui-sheet", "/assets/wilds/ui/battle_ui_sheet.png");
    this.load.image("results-ui-sheet", "/assets/wilds/ui/results_ui_sheet.png");
    for (const image of this.region.assets.images) this.load.image(image.key, image.path);
    for (const sheet of this.region.assets.sheets) this.load.image(sheet.key, sheet.path);
    this.load.image("wilds-player-cap", `/assets/capsule/caps/${this.equippedCapId}.png`);

    const barBg = this.add.rectangle(WILDS_WIDTH / 2, WILDS_HEIGHT / 2, 320, 14, 0x20344a).setOrigin(0.5);
    const bar = this.add.rectangle(WILDS_WIDTH / 2 - 156, WILDS_HEIGHT / 2, 0, 14, 0x6ee7f9).setOrigin(0, 0.5);
    this.add.rectangle(0, 0, WILDS_WIDTH, WILDS_HEIGHT, 0x08121f).setOrigin(0).setDepth(-1);
    this.load.on("progress", (value: number) => {
      bar.width = 312 * value;
      barBg.setAlpha(1);
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error("Wilds asset 404:", file.src);
    });
  }

  create() {
    this.cropFromSheet("title-buttons-sheet", TITLE_BUTTONS);
    this.cropFromSheet("battle-ui-sheet", BATTLE_UI);
    this.cropFromSheet("results-ui-sheet", RESULTS_UI);
    this.cropRegionAssets();
    this.createRoundPlayerCap();

    this.registry.set("wilds:assets-ready", true);
    try {
      const ctx = new AudioContext();
      this.registry.set(REGISTRY_KEYS.wildsAudio, new WildsAudioManager(ctx));
    } catch { /* audio unavailable */ }
    this.scene.start("TitleScene");
  }

  private cropRegionAssets() {
    for (const sheet of this.region.assets.sheets) {
      const crops = Object.fromEntries(sheet.sprites.map((sprite) => [
        sprite.key,
        {
          x: (sprite.index % sheet.columns) * sheet.cellWidth,
          y: Math.floor(sprite.index / sheet.columns) * sheet.cellHeight,
          width: sheet.cellWidth,
          height: sheet.cellHeight,
        },
      ]));
      this.cropFromSheet(sheet.key, crops, sheet.removeEdgeMatte);
    }
  }

  private cropFromSheet(sheetKey: string, map: Record<string, CropRect>, removeEdgeMatte = true) {
    const source = this.textures.get(sheetKey).getSourceImage() as CanvasImageSource;
    for (const [key, rect] of Object.entries(map)) {
      this.createFromSource(key, source, rect, removeEdgeMatte);
    }
  }

  private createFromSource(key: string, source: CanvasImageSource, rect: CropRect, removeEdgeMatte: boolean) {
    const texture = this.textures.createCanvas(key, rect.width, rect.height);
    if (!texture) return;
    const ctx = texture.context;
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    if (removeEdgeMatte) this.removeEdgeMatte(ctx, rect.width, rect.height);
    texture.refresh();
  }

  private createRoundPlayerCap() {
    const source = this.textures.get("wilds-player-cap").getSourceImage() as CanvasImageSource;
    const size = 256;
    const texture = this.textures.createCanvas("wilds-player-cap-round", size, size);
    if (!texture) return;
    const ctx = texture.context;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, size, size);
    ctx.restore();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(8, 24, 44, 0.95)";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
    ctx.stroke();
    texture.refresh();
  }

  private removeEdgeMatte(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    const isMatte = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha === 0) return false;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const avg = (r + g + b) / 3;
      return avg >= 205 && max - min <= 34;
    };

    const enqueue = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const flat = y * width + x;
      if (visited[flat] || !isMatte(x, y)) return;
      visited[flat] = 1;
      queue.push(flat);
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 0; y < height; y += 1) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    let head = 0;
    while (head < queue.length) {
      if (head > 1000) { queue.splice(0, head); head = 0; }
      const flat = queue[head++];
      const x = flat % width;
      const y = Math.floor(flat / width);
      const index = flat * 4;
      data[index + 3] = 0;
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
