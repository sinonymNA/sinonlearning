export type RegionRarity = "common" | "rare" | "epic" | "boss";
export type PickupEffectType = "coins" | "heal" | "shield" | "power" | "captureBonus" | "hint";

export interface RegionImageAsset {
  key: string;
  path: string;
  expectedWidth: number;
  expectedHeight: number;
}

export interface RegionSheetSprite {
  key: string;
  index: number;
}

export interface RegionSheetAsset {
  key: string;
  path: string;
  columns: number;
  cellWidth: number;
  cellHeight: number;
  removeEdgeMatte: boolean;
  sprites: RegionSheetSprite[];
}

export interface RegionCreature {
  id: string;
  name: string;
  rarity: RegionRarity;
  texture: string;
  captureRate: number;
  hp: number;
}

export interface RegionPickup {
  id: string;
  texture: string;
  glow: string;
  effect: { type: PickupEffectType; amount: number };
  message: string;
}

export interface RegionQuestion {
  prompt: string;
  choices: [string, string, string, string];
  answer: number;
}

export interface RegionRoomPickup {
  x: number;
  id?: string;
  oneOf?: string[];
}

export interface RegionEncounter {
  x: number;
  creatureId?: string;
  rarityWeights?: Partial<Record<RegionRarity, number>>;
}

export interface RegionRoom {
  id: string;
  name: string;
  background: string;
  prompt: string;
  promptDuration?: number;
  pickups?: RegionRoomPickup[];
  encounter?: RegionEncounter;
}

export interface WildsRegionManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  shortName: string;
  difficulty: number;
  creativeBrief: {
    theme: string;
    environment: string;
    palette: string;
    artStyle: string;
    negativePrompt: string;
  };
  copy: {
    titleSubtitle: string;
    startCaption: string;
    replayCaption: string;
    victoryHeading: string;
    victorySummary: string;
  };
  assets: {
    images: RegionImageAsset[];
    sheets: RegionSheetAsset[];
  };
  presentation: {
    rarityColors: Record<RegionRarity, string>;
    rarityGlows: Record<RegionRarity, string>;
    raritySizes: Record<RegionRarity, number>;
    sceneryPool: string[];
    scenerySlots: Array<{ x: number; y: number; size: number }>;
  };
  gameplay: {
    startingHp: number;
    floorY: number;
    playerMinY: number;
    playerMaxY: number;
    exitX: number;
    coinRewards: Record<RegionRarity, number>;
  };
  creatures: RegionCreature[];
  pickups: RegionPickup[];
  rooms: RegionRoom[];
  questions: RegionQuestion[];
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid Wilds region manifest: ${message}`);
}

export function validateRegionManifest(value: unknown): WildsRegionManifest {
  invariant(value && typeof value === "object", "root must be an object");
  const region = value as WildsRegionManifest;
  invariant(region.schemaVersion === 1, "schemaVersion must be 1");
  invariant(/^[a-z0-9-]+$/.test(region.id), "id must use lowercase kebab-case");
  invariant(region.name.length > 0 && region.shortName.length > 0, "name fields are required");
  invariant(region.assets.images.length >= 3, "at least three background images are required");
  invariant(region.assets.sheets.length >= 3, "creature, scenery, and pickup sheets are required");
  invariant(region.creatures.length >= 4, "at least four creatures are required");
  invariant(region.rooms.length >= 3, "at least three rooms are required");
  invariant(region.questions.length >= 8, "at least eight questions are required");

  const creatureIds = new Set(region.creatures.map((creature) => creature.id));
  invariant(creatureIds.size === region.creatures.length, "creature ids must be unique");
  const textureKeys = new Set(region.assets.sheets.flatMap((sheet) => sheet.sprites.map((sprite) => sprite.key)));
  const imageKeys = new Set(region.assets.images.map((image) => image.key));
  for (const creature of region.creatures) {
    invariant(textureKeys.has(creature.texture), `creature ${creature.id} has an unknown texture`);
    invariant(creature.captureRate > 0 && creature.captureRate <= 1, `creature ${creature.id} captureRate must be 0-1`);
    invariant(creature.hp > 0, `creature ${creature.id} must have positive hp`);
  }

  const pickupIds = new Set(region.pickups.map((pickup) => pickup.id));
  for (const pickup of region.pickups) invariant(textureKeys.has(pickup.texture), `pickup ${pickup.id} has an unknown texture`);
  for (const room of region.rooms) {
    invariant(imageKeys.has(room.background), `room ${room.id} has an unknown background`);
    if (room.encounter?.creatureId) invariant(creatureIds.has(room.encounter.creatureId), `room ${room.id} has an unknown creature`);
    for (const pickup of room.pickups ?? []) {
      invariant(Boolean(pickup.id) !== Boolean(pickup.oneOf), `room ${room.id} pickups need exactly one of id or oneOf`);
      for (const id of pickup.oneOf ?? [pickup.id!]) invariant(pickupIds.has(id), `room ${room.id} has unknown pickup ${id}`);
    }
  }
  for (const question of region.questions) {
    invariant(question.choices.length === 4, "every question must have four choices");
    invariant(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, "question answer must be 0-3");
  }
  return region;
}

export function hexColor(value: string): number {
  return Number.parseInt(value.replace(/^#/, ""), 16);
}
