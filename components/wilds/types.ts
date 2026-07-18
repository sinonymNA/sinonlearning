export type WildsRarity = "common" | "rare" | "epic" | "boss";
export type WildsNodeType =
  | "start"
  | "wild"
  | "trainer"
  | "capture"
  | "shop"
  | "heal"
  | "mystery"
  | "treasure"
  | "miniboss"
  | "boss";

export interface WildsCreature {
  id: string;
  name: string;
  rarity: WildsRarity;
  region: string;
  element: string;
  ability: string;
  maxHp: number;
  attack: number;
  defense: number;
  captureRate: number;
  sprite: string;
  portrait: string;
}

export interface WildsAbility {
  name: string;
  description: string;
}

export interface WildsItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "battle" | "capture" | "passive";
  value: number;
}

export interface WildsRegion {
  id: string;
  name: string;
  difficulty: number;
  mapBackground: string;
  battleBackground: string;
  wildPool: string[];
  boss: string;
}

export interface WildsNode {
  id: string;
  type: WildsNodeType;
  x: number;
  y: number;
  next: string[];
}

export interface WildsQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface InventoryItem {
  id: string;
  quantity: number;
}

export interface UpgradeChoice {
  id: string;
  label: string;
  description: string;
}

export interface BattleCreatureState {
  creatureId: string;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  shield: number;
}

export interface WildsRunSave {
  region: string;
  currentNode: string;
  completedNodes: string[];
  playerCreature: string;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  items: InventoryItem[];
  upgrades: string[];
  coinsEarned: number;
  captureBonus: number;
  coinBonus: number;
  usedRevive: boolean;
}

export interface WildsPermanentSave {
  wildsCollection: string[];
  regionsUnlocked: string[];
  totalCoins: number;
  stats: {
    battlesWon: number;
    creaturesCaptured: number;
    runsCompleted: number;
  };
}

export interface BattleSceneData {
  nodeId: string;
  encounterId: string;
  isBoss: boolean;
}

export interface CaptureSceneData {
  nodeId: string;
  encounterId: string;
  isBoss: boolean;
  victory: boolean;
}

export interface RewardSceneData {
  nodeId: string;
  title: string;
  summary: string;
  victory: boolean;
  captureSuccess?: boolean;
  capturedCreatureId?: string;
  baseCoins: number;
  upgradeChoices?: UpgradeChoice[];
}
