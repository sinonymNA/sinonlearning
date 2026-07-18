import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { REGISTRY_KEYS, WILDS_HEIGHT, WILDS_WIDTH } from "../gameState";
import { WildsAudioManager } from "../WildsAudio";

type CropRect = { x: number; y: number; width: number; height: number };

const CREATURE_A_BATTLE: Record<string, CropRect> = {
  sparkit: { x: 20, y: 20, width: 370, height: 360 },
  mossprout: { x: 430, y: 30, width: 360, height: 350 },
  aquablob: { x: 860, y: 20, width: 360, height: 350 },
  pebblit: { x: 20, y: 430, width: 360, height: 360 },
  thornpaw: { x: 420, y: 390, width: 380, height: 420 },
  galehawk: { x: 860, y: 390, width: 360, height: 390 },
};

const CREATURE_A_PORTRAIT: Record<string, CropRect> = {
  sparkit_portrait: { x: 20, y: 20, width: 360, height: 360 },
  mossprout_portrait: { x: 430, y: 30, width: 360, height: 350 },
  aquablob_portrait: { x: 860, y: 20, width: 360, height: 350 },
  pebblit_portrait: { x: 20, y: 430, width: 360, height: 360 },
  thornpaw_portrait: { x: 420, y: 390, width: 380, height: 420 },
  galehawk_portrait: { x: 860, y: 390, width: 360, height: 390 },
};

const CREATURE_B_BATTLE: Record<string, CropRect> = {
  lumimoth: { x: 0, y: 0, width: 214, height: 214 },
  brookhorn: { x: 214, y: 0, width: 214, height: 214 },
  crystal_drake: { x: 428, y: 0, width: 214, height: 214 },
  nightfang: { x: 642, y: 0, width: 214, height: 214 },
  sun_stag: { x: 856, y: 0, width: 214, height: 214 },
  warden_wisp: { x: 1070, y: 0, width: 210, height: 214 },
};

const CREATURE_B_PORTRAIT: Record<string, CropRect> = {
  lumimoth_portrait: { x: 0, y: 214, width: 214, height: 212 },
  brookhorn_portrait: { x: 214, y: 214, width: 214, height: 212 },
  crystal_drake_portrait: { x: 428, y: 214, width: 214, height: 212 },
  nightfang_portrait: { x: 642, y: 214, width: 214, height: 212 },
  sun_stag_portrait: { x: 856, y: 214, width: 214, height: 212 },
  warden_wisp_portrait: { x: 1070, y: 214, width: 210, height: 212 },
};

const TITLE_BUTTONS: Record<string, CropRect> = {
  btn_primary: { x: 45, y: 165, width: 515, height: 205 },
  btn_secondary: { x: 655, y: 165, width: 565, height: 205 },
  btn_purple: { x: 45, y: 560, width: 535, height: 215 },
  btn_gold: { x: 665, y: 560, width: 530, height: 215 },
};

const BATTLE_UI: Record<string, CropRect> = {
  battle_hp_player_frame: { x: 20, y: 20, width: 560, height: 120 },
  battle_hp_enemy_frame: { x: 700, y: 20, width: 560, height: 120 },
  battle_question_panel: { x: 110, y: 180, width: 1060, height: 300 },
  battle_answer_button_green: { x: 20, y: 520, width: 290, height: 150 },
  battle_answer_button_blue: { x: 330, y: 520, width: 290, height: 150 },
  battle_answer_button_purple: { x: 640, y: 520, width: 290, height: 150 },
  battle_answer_button_gold: { x: 950, y: 520, width: 290, height: 150 },
  battle_backpack_icon: { x: 20, y: 730, width: 150, height: 150 },
  battle_item_panel: { x: 250, y: 730, width: 420, height: 190 },
  battle_reward_panel: { x: 720, y: 730, width: 480, height: 190 },
};

const CAPTURE_UI: Record<string, CropRect> = {
  capture_capsule_closed: { x: 10, y: 20, width: 220, height: 190 },
  capture_capsule_top: { x: 240, y: 20, width: 220, height: 190 },
  capture_capsule_bottom: { x: 470, y: 20, width: 220, height: 190 },
  capture_success_burst: { x: 960, y: 5, width: 280, height: 220 },
  capture_fail_puff: { x: 0, y: 240, width: 250, height: 240 },
  capture_rare_glow: { x: 350, y: 250, width: 250, height: 220 },
  capture_beam: { x: 690, y: 240, width: 250, height: 240 },
};

const MAP_MARKERS: Record<string, CropRect> = {
  map_player_marker: { x: 0, y: 0, width: 250, height: 250 },
  map_current_marker: { x: 420, y: 0, width: 450, height: 320 },
  map_path_marker: { x: 930, y: 60, width: 300, height: 180 },
};

const RESULTS_UI: Record<string, CropRect> = {
  results_reward_panel: { x: 90, y: 70, width: 680, height: 390 },
  results_continue_button: { x: 65, y: 520, width: 340, height: 170 },
  results_summary_panel: { x: 405, y: 450, width: 360, height: 360 },
  results_victory_badge: { x: 75, y: 880, width: 330, height: 250 },
  results_defeat_badge: { x: 435, y: 875, width: 330, height: 255 },
};

const ITEM_REWARD_UI: Record<string, CropRect> = {
  item_heal_capsule: { x: 0, y: 0, width: 250, height: 315 },
  item_power_capsule: { x: 250, y: 0, width: 250, height: 315 },
  item_shield_capsule: { x: 500, y: 0, width: 250, height: 315 },
  item_lucky_capsule: { x: 750, y: 0, width: 250, height: 315 },
  item_revive_capsule: { x: 1000, y: 0, width: 254, height: 315 },
  reward_coin: { x: 0, y: 630, width: 250, height: 250 },
  reward_xp_star: { x: 250, y: 630, width: 250, height: 250 },
  reward_capture_badge: { x: 500, y: 620, width: 250, height: 260 },
  reward_boss_badge: { x: 750, y: 620, width: 250, height: 260 },
  reward_treasure: { x: 1000, y: 620, width: 254, height: 260 },
};

const NODE_ICONS: Record<string, CropRect> = {
  node_start: { x: 0, y: 0, width: 314, height: 314 },
  node_wild: { x: 314, y: 0, width: 314, height: 314 },
  node_trainer: { x: 628, y: 0, width: 314, height: 314 },
  node_capture: { x: 942, y: 0, width: 312, height: 314 },
  node_shop: { x: 0, y: 314, width: 314, height: 314 },
  node_heal: { x: 314, y: 314, width: 314, height: 314 },
  node_mystery: { x: 628, y: 314, width: 314, height: 314 },
  node_treasure: { x: 942, y: 314, width: 312, height: 314 },
  node_miniboss: { x: 0, y: 628, width: 314, height: 314 },
  node_boss: { x: 314, y: 628, width: 314, height: 314 },
  node_completed: { x: 628, y: 628, width: 314, height: 314 },
  node_current: { x: 942, y: 628, width: 312, height: 314 },
  node_locked: { x: 0, y: 942, width: 314, height: 312 },
};

export class BootScene extends Phaser.Scene {
  constructor(private readonly equippedCapId = "cap-fox") {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("wilds-logo-sheet", "/assets/wilds/logos/wilds_logo.png");
    this.load.image("title-bg", "/assets/wilds/backgrounds/title_bg.png");
    this.load.image("title-buttons-sheet", "/assets/wilds/ui/title_buttons_sheet.png");
    this.load.image("verdant-battle-bg", "/assets/wilds/backgrounds/verdant_battle_bg.png");
    this.load.image("battle-ui-sheet", "/assets/wilds/ui/battle_ui_sheet.png");
    this.load.image("creatures-a-battle-sheet", "/assets/wilds/creatures/verdant_set_a_battle_sheet.png");
    this.load.image("creatures-a-portrait-sheet", "/assets/wilds/creatures/verdant_set_a_portrait_sheet.png");
    this.load.image("capture-sheet", "/assets/wilds/capture/capture_system_sheet.png");
    this.load.image("verdant-map-bg", "/assets/wilds/backgrounds/verdant_map_bg.png");
    this.load.image("map-markers-sheet", "/assets/wilds/map/map_markers_sheet.png");
    this.load.image("creatures-b-sheet", "/assets/wilds/creatures/verdant_set_b_combined_sheet.png");
    this.load.image("results-ui-sheet", "/assets/wilds/ui/results_ui_sheet.png");
    this.load.image("items-rewards-sheet", "/assets/wilds/items/items_rewards_sheet.png");
    this.load.image("node-icons-sheet", "/assets/wilds/nodes/node_icons_sheet.png");
    this.load.image("expedition-meadow", "/assets/wilds/expedition/meadow.jpg");
    this.load.image("expedition-crystal", "/assets/wilds/expedition/crystal_grove.jpg");
    this.load.image("expedition-gate", "/assets/wilds/expedition/rift_gate.jpg");
    this.load.image("expedition-creatures-sheet", "/assets/wilds/expedition/creatures_sheet.jpg");
    this.load.image("expedition-props-sheet", "/assets/wilds/expedition/props_sheet.jpg");
    this.load.image("expedition-pickups-sheet", "/assets/wilds/expedition/pickups_sheet.jpg");
    this.load.image("expedition-effects-sheet", "/assets/wilds/expedition/effects_sheet.jpg");
    this.load.image("wilds-player-cap", `/assets/capsule/caps/${this.equippedCapId}.png`);

    this.load.json("wilds-creatures", "/assets/wilds/data/creatures.json");
    this.load.json("wilds-abilities", "/assets/wilds/data/abilities.json");
    this.load.json("wilds-items", "/assets/wilds/data/items.json");
    this.load.json("wilds-regions", "/assets/wilds/data/regions.json");
    this.load.json("wilds-nodes", "/assets/wilds/data/nodes.json");
    this.load.json("wilds-questions", "/assets/wilds/data/questions.json");

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
    const logoSource = this.textures.get("wilds-logo-sheet").getSourceImage() as CanvasImageSource;
    this.createFromSource("wilds_logo", logoSource, { x: 0, y: 0, width: 1280, height: 631 });
    this.cropFromSheet("title-buttons-sheet", TITLE_BUTTONS);
    this.cropFromSheet("battle-ui-sheet", BATTLE_UI);
    this.cropFromSheet("creatures-a-battle-sheet", CREATURE_A_BATTLE);
    this.cropFromSheet("creatures-a-portrait-sheet", CREATURE_A_PORTRAIT);
    this.cropFromSheet("capture-sheet", CAPTURE_UI);
    this.cropFromSheet("map-markers-sheet", MAP_MARKERS);
    this.cropFromSheet("creatures-b-sheet", CREATURE_B_BATTLE);
    this.cropFromSheet("creatures-b-sheet", CREATURE_B_PORTRAIT);
    this.cropFromSheet("results-ui-sheet", RESULTS_UI);
    this.cropFromSheet("items-rewards-sheet", ITEM_REWARD_UI);
    this.cropFromSheet("node-icons-sheet", NODE_ICONS);
    this.cropExpeditionAssets();

    this.registry.set("wilds:assets-ready", true);
    try {
      const ctx = new AudioContext();
      this.registry.set(REGISTRY_KEYS.wildsAudio, new WildsAudioManager(ctx));
    } catch { /* audio unavailable */ }
    this.scene.start("TitleScene");
  }

  private cropExpeditionAssets() {
    const creatures = ["sparkit", "mossprout", "aquablob", "pebblit", "thornpaw", "galehawk", "lumimoth", "brookhorn", "crystal_drake", "nightfang", "sun_stag", "warden_wisp"];
    const creatureCrops = Object.fromEntries(creatures.map((id, index) => [
      `field_${id}`,
      { x: (index % 4) * 320, y: Math.floor(index / 4) * 320, width: 320, height: 320 },
    ]));
    this.cropFromSheet("expedition-creatures-sheet", creatureCrops);

    const propCrops = Object.fromEntries(["grass", "flowers", "mushrooms", "crystal", "rock", "pillar", "ruin", "stump", "bush", "log", "rune", "stream"].map((id, index) => [
      `prop_${id}`,
      { x: (index % 4) * 320, y: Math.floor(index / 4) * 320, width: 320, height: 320 },
    ]));
    this.cropFromSheet("expedition-props-sheet", propCrops);

    const pickupCrops = Object.fromEntries(["coin", "heal", "shield", "power", "lucky", "hint", "double", "streak"].map((id, index) => [
      `pickup_${id}`,
      { x: (index % 4) * 320, y: Math.floor(index / 4) * 360, width: 320, height: 360 },
    ]));
    this.cropFromSheet("expedition-pickups-sheet", pickupCrops);
  }

  private cropFromSheet(sheetKey: string, map: Record<string, CropRect>) {
    const source = this.textures.get(sheetKey).getSourceImage() as CanvasImageSource;
    for (const [key, rect] of Object.entries(map)) {
      this.createFromSource(key, source, rect);
    }
  }

  private createFromSource(key: string, source: CanvasImageSource, rect: CropRect) {
    const texture = this.textures.createCanvas(key, rect.width, rect.height);
    if (!texture) return;
    const ctx = texture.context;
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    this.removeEdgeMatte(ctx, rect.width, rect.height);
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
