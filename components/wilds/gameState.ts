import Phaser from "phaser";
import type {
  UpgradeChoice,
  WildsAbility,
  WildsCreature,
  WildsItemDef,
  WildsNode,
  WildsQuestion,
  WildsRegion,
  WildsRarity,
} from "./types";

export const WILDS_WIDTH = 1920;
export const WILDS_HEIGHT = 1080;

export const REGISTRY_KEYS = {
  playerAttackBuff: "wilds:playerAttackBuff",
  playerShieldBuff: "wilds:playerShieldBuff",
  playerLuckyBuff: "wilds:playerLuckyBuff",
  lastBattleResult: "wilds:lastBattleResult",
  enemyShieldActive: "wilds:enemyShieldActive",
  wildsAudio: "wilds:audio",
} as const;

export function getCreatures(scene: Phaser.Scene): WildsCreature[] {
  return scene.cache.json.get("wilds-creatures") as WildsCreature[];
}

export function getAbilities(scene: Phaser.Scene): Record<string, WildsAbility> {
  return scene.cache.json.get("wilds-abilities") as Record<string, WildsAbility>;
}

export function getItems(scene: Phaser.Scene): WildsItemDef[] {
  return scene.cache.json.get("wilds-items") as WildsItemDef[];
}

export function getRegions(scene: Phaser.Scene): WildsRegion[] {
  return scene.cache.json.get("wilds-regions") as WildsRegion[];
}

export function getNodes(scene: Phaser.Scene): WildsNode[] {
  return scene.cache.json.get("wilds-nodes") as WildsNode[];
}

export function getQuestions(scene: Phaser.Scene): WildsQuestion[] {
  return scene.cache.json.get("wilds-questions") as WildsQuestion[];
}

export function creatureById(scene: Phaser.Scene, id: string): WildsCreature {
  const creature = getCreatures(scene).find((entry) => entry.id === id);
  if (!creature) throw new Error(`Unknown creature: ${id}`);
  return creature;
}

export function itemById(scene: Phaser.Scene, id: string): WildsItemDef {
  const item = getItems(scene).find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

export function pickEncounter(scene: Phaser.Scene, type: WildsNode["type"]): string {
  const region = getRegions(scene)[0];
  const creatures = getCreatures(scene);
  if (type === "boss") return region.boss;
  if (type === "miniboss") {
    const epicPool = creatures.filter((creature) => creature.rarity === "epic");
    return Phaser.Utils.Array.GetRandom(epicPool).id;
  }
  const normalPool = region.wildPool
    .map((id) => creatureById(scene, id))
    .filter((creature) => creature.rarity !== "boss");
  return Phaser.Utils.Array.GetRandom(normalPool).id;
}

export function rarityColor(rarity: WildsRarity): string {
  switch (rarity) {
    case "common": return "#9ae6b4";
    case "rare": return "#7dd3fc";
    case "epic": return "#c4b5fd";
    case "boss": return "#fda4af";
  }
}

export function nodeIconKey(type: WildsNode["type"]): string {
  switch (type) {
    case "start": return "node_start";
    case "wild": return "node_wild";
    case "trainer": return "node_trainer";
    case "capture": return "node_capture";
    case "shop": return "node_shop";
    case "heal": return "node_heal";
    case "mystery": return "node_mystery";
    case "treasure": return "node_treasure";
    case "miniboss": return "node_miniboss";
    case "boss": return "node_boss";
  }
}

export function generateUpgradeChoices(): UpgradeChoice[] {
  const source: UpgradeChoice[] = [
    { id: "hp_up", label: "+10 Max HP", description: "Bulk up for the next battles." },
    { id: "attack_up", label: "+2 Attack", description: "Hit a little harder on correct answers." },
    { id: "heal_up", label: "Heal 20 HP", description: "Recover before the next node." },
    { id: "capture_up", label: "+10% Capture", description: "Improve capture odds for this run." },
    { id: "coin_up", label: "+10% Coins", description: "Earn more coins from future rewards." },
  ];
  return (Phaser.Utils.Array.Shuffle(source) as UpgradeChoice[]).slice(0, 3);
}

export function damageForCorrectAnswer(attack: number, streak: number, defense: number, streakBoost = false, crit = false): number {
  const baseBonus = 4;
  const rawStreak = Math.floor(streak / 2) * 2;
  const streakBonus = streakBoost ? rawStreak + 2 : rawStreak;
  const critBonus = crit ? Math.ceil(attack * 0.5) : 0;
  return Math.max(1, attack + baseBonus + streakBonus + critBonus - defense);
}

export function captureChance(baseRate: number, runBonus: number, luckyBonus: number, perfectBattleBonus: number): number {
  return Phaser.Math.Clamp(baseRate + runBonus + luckyBonus + perfectBattleBonus, 0.05, 0.95);
}

export function scaleToFit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}
