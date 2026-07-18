import type {
  InventoryItem,
  UpgradeChoice,
  WildsPermanentSave,
  WildsRunSave,
} from "./types";

const RUN_KEY = "capsule-wilds-run";
const SAVE_KEY = "capsule-wilds-save";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getPermanentSave(): WildsPermanentSave {
  if (!hasWindow()) {
    return {
      wildsCollection: [],
      regionsUnlocked: ["verdant_rift"],
      totalCoins: 0,
      stats: { battlesWon: 0, creaturesCaptured: 0, runsCompleted: 0 },
    };
  }
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return {
      wildsCollection: [],
      regionsUnlocked: ["verdant_rift"],
      totalCoins: 0,
      stats: { battlesWon: 0, creaturesCaptured: 0, runsCompleted: 0 },
    };
  }
  return JSON.parse(raw) as WildsPermanentSave;
}

export function setPermanentSave(save: WildsPermanentSave) {
  if (!hasWindow()) return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function getRunSave(): WildsRunSave | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(RUN_KEY);
  return raw ? (JSON.parse(raw) as WildsRunSave) : null;
}

export function setRunSave(run: WildsRunSave) {
  if (!hasWindow()) return;
  window.localStorage.setItem(RUN_KEY, JSON.stringify(run));
}

export function clearRunSave() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(RUN_KEY);
}

export function createStarterRunSave(starterId: string, maxHp: number, attack: number, defense: number): WildsRunSave {
  const items: InventoryItem[] = [
    { id: "heal_capsule", quantity: 1 },
    { id: "lucky_capsule", quantity: 1 },
  ];

  return {
    region: "verdant_rift",
    currentNode: "n0",
    completedNodes: [],
    playerCreature: starterId,
    currentHp: maxHp,
    maxHp,
    attack,
    defense,
    items,
    upgrades: [],
    coinsEarned: 0,
    captureBonus: 0,
    coinBonus: 0,
    usedRevive: false,
  };
}

export function appendToCollection(creatureId: string) {
  const save = getPermanentSave();
  if (!save.wildsCollection.includes(creatureId)) {
    save.wildsCollection.push(creatureId);
    save.stats.creaturesCaptured += 1;
    setPermanentSave(save);
  }
}

export function grantCoins(amount: number) {
  const save = getPermanentSave();
  save.totalCoins += amount;
  setPermanentSave(save);
}

export function registerBattleWin() {
  const save = getPermanentSave();
  save.stats.battlesWon += 1;
  setPermanentSave(save);
}

export function registerRunComplete() {
  const save = getPermanentSave();
  save.stats.runsCompleted += 1;
  setPermanentSave(save);
}

export function applyUpgradeToRun(run: WildsRunSave, choice: UpgradeChoice): WildsRunSave {
  const next = { ...run, items: [...run.items], upgrades: [...run.upgrades, choice.id] };
  switch (choice.id) {
    case "hp_up":
      next.maxHp += 10;
      next.currentHp = Math.min(next.maxHp, next.currentHp + 10);
      break;
    case "attack_up":
      next.attack += 2;
      break;
    case "heal_up":
      next.currentHp = Math.min(next.maxHp, next.currentHp + 20);
      break;
    case "capture_up":
      next.captureBonus += 0.1;
      break;
    case "coin_up":
      next.coinBonus += 0.1;
      break;
  }
  return next;
}
