import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const regionsDir = path.join(root, "components", "wilds", "regions");

function fail(message) {
  console.error(`Wilds region error: ${message}`);
  process.exitCode = 1;
}

function resolveManifest(input = "verdant-rift") {
  const candidate = input.endsWith(".json") ? path.resolve(root, input) : path.join(regionsDir, `${input}.json`);
  if (!fs.existsSync(candidate)) throw new Error(`Manifest not found: ${candidate}`);
  return candidate;
}

function readManifest(input) {
  const file = resolveManifest(input);
  return { file, region: JSON.parse(fs.readFileSync(file, "utf8")) };
}

function imageSize(file) {
  const data = fs.readFileSync(file);
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), format: "PNG" };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset < data.length) {
      if (data[offset] !== 0xff) { offset += 1; continue; }
      const marker = data[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5), format: "JPEG" };
      }
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      offset += 2 + data.readUInt16BE(offset + 2);
    }
  }
  throw new Error(`Unsupported image format: ${file}`);
}

function validate(region, file) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(region.schemaVersion === 1, "schemaVersion must be 1");
  check(/^[a-z0-9-]+$/.test(region.id ?? ""), "id must be lowercase kebab-case");
  check((region.creatures?.length ?? 0) >= 4, "at least four creatures are required");
  check((region.rooms?.length ?? 0) >= 3, "at least three rooms are required");
  check((region.questions?.length ?? 0) >= 8, "at least eight questions are required");

  const textureKeys = new Set();
  for (const sheet of region.assets?.sheets ?? []) {
    const assetFile = path.join(root, "public", sheet.path.replace(/^\//, ""));
    check(fs.existsSync(assetFile), `missing sheet ${sheet.path}`);
    const indexes = new Set();
    for (const sprite of sheet.sprites ?? []) {
      check(!textureKeys.has(sprite.key), `duplicate texture key ${sprite.key}`);
      check(!indexes.has(sprite.index), `duplicate index ${sprite.index} in ${sheet.key}`);
      textureKeys.add(sprite.key);
      indexes.add(sprite.index);
    }
    if (fs.existsSync(assetFile)) {
      const dimensions = imageSize(assetFile);
      const rows = Math.ceil((Math.max(...[...indexes, 0]) + 1) / sheet.columns);
      check(dimensions.width === sheet.columns * sheet.cellWidth, `${sheet.path} width is ${dimensions.width}; expected ${sheet.columns * sheet.cellWidth}`);
      check(dimensions.height >= rows * sheet.cellHeight, `${sheet.path} height is ${dimensions.height}; needs at least ${rows * sheet.cellHeight}`);
    }
  }

  const imageKeys = new Set();
  for (const image of region.assets?.images ?? []) {
    const assetFile = path.join(root, "public", image.path.replace(/^\//, ""));
    check(!imageKeys.has(image.key), `duplicate image key ${image.key}`);
    imageKeys.add(image.key);
    check(fs.existsSync(assetFile), `missing image ${image.path}`);
    if (fs.existsSync(assetFile)) {
      const dimensions = imageSize(assetFile);
      check(dimensions.width === image.expectedWidth && dimensions.height === image.expectedHeight, `${image.path} is ${dimensions.width}x${dimensions.height}; expected ${image.expectedWidth}x${image.expectedHeight}`);
    }
  }

  const creatureIds = new Set();
  for (const creature of region.creatures ?? []) {
    check(!creatureIds.has(creature.id), `duplicate creature id ${creature.id}`);
    creatureIds.add(creature.id);
    check(textureKeys.has(creature.texture), `creature ${creature.id} references missing texture ${creature.texture}`);
    check(creature.captureRate > 0 && creature.captureRate <= 1, `creature ${creature.id} captureRate must be 0-1`);
  }
  const pickupIds = new Set((region.pickups ?? []).map((pickup) => pickup.id));
  for (const pickup of region.pickups ?? []) check(textureKeys.has(pickup.texture), `pickup ${pickup.id} references missing texture ${pickup.texture}`);
  for (const room of region.rooms ?? []) {
    check(imageKeys.has(room.background), `room ${room.id} references missing background ${room.background}`);
    if (room.encounter?.creatureId) check(creatureIds.has(room.encounter.creatureId), `room ${room.id} references missing creature ${room.encounter.creatureId}`);
    for (const spawn of room.pickups ?? []) {
      check(Boolean(spawn.id) !== Boolean(spawn.oneOf), `room ${room.id} pickup needs exactly one of id or oneOf`);
      for (const id of spawn.oneOf ?? [spawn.id]) check(pickupIds.has(id), `room ${room.id} references missing pickup ${id}`);
    }
  }
  for (const [index, question] of (region.questions ?? []).entries()) {
    check(question.choices?.length === 4, `question ${index + 1} must have four choices`);
    check(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, `question ${index + 1} answer must be 0-3`);
  }

  if (errors.length) {
    console.error(`\n${path.relative(root, file)} failed validation:`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`OK ${region.name}: ${region.creatures.length} creatures, ${region.rooms.length} rooms, ${region.questions.length} questions`);
  return true;
}

function prompts(region) {
  const brief = region.creativeBrief;
  const base = `${brief.artStyle} Theme: ${brief.theme} Palette: ${brief.palette}`;
  const negative = `Avoid: ${brief.negativePrompt}`;
  const creatures = region.creatures.map((creature) => `${creature.name} (${creature.rarity})`).join(", ");
  const props = region.presentation.sceneryPool.map((key) => key.replace(/^prop_/, "")).join(", ");
  const pickups = region.pickups.map((pickup) => pickup.id).join(", ");
  const creatureSheet = region.assets.sheets.find((sheet) => sheet.key.includes("creatures"));
  const propSheet = region.assets.sheets.find((sheet) => sheet.key.includes("props"));
  const pickupSheet = region.assets.sheets.find((sheet) => sheet.key.includes("pickups"));
  const promptList = [
    ["FIELD BACKGROUND A", `${base} Create a 16:9 side-view game field for ${region.name}. ${brief.environment} Keep a broad unobstructed walkable ground lane across the lower-middle 25% of the image. No characters, pickups, UI, or foreground objects blocking the lane. The left and right edges should have similar lighting and horizon height so alternating rooms transition smoothly. 1280x720. ${negative}`],
    ["FIELD BACKGROUND B", `${base} Create a second 16:9 side-view field in the same region, camera angle, horizon, lane height, lighting, and scale as Background A, but with a distinct landmark. Keep the same unobstructed walkable lane and transition-compatible edges. 1280x720. ${negative}`],
    ["BOSS GATE BACKGROUND", `${base} Create a dramatic final-room field with a magical gate on the right side, preserving the exact same side-view camera, horizon, and unobstructed ground lane as the other region backgrounds. 1280x720. ${negative}`],
    ["CREATURE SHEET", `${base} Create one sprite sheet on a pure white background, exactly ${creatureSheet?.columns ?? 4} columns with equal ${creatureSheet?.cellWidth ?? 320}x${creatureSheet?.cellHeight ?? 320} cells. One centered full-body creature per cell, consistent three-quarter view, complete silhouette, generous whitespace, no overlap. Row-major order: ${creatures}. Output exactly ${(creatureSheet?.columns ?? 4) * (creatureSheet?.cellWidth ?? 320)} pixels wide. ${negative}`],
    ["SCENERY SHEET", `${base} Create one sprite sheet on a pure white background, exactly ${propSheet?.columns ?? 4} columns with equal ${propSheet?.cellWidth ?? 320}x${propSheet?.cellHeight ?? 320} cells. One centered environmental prop per cell with complete silhouette and ground contact. Row-major order: ${props}. No creatures and no overlap. ${negative}`],
    ["PICKUP SHEET", `${base} Create one sprite sheet on a pure white background, exactly ${pickupSheet?.columns ?? 4} columns with equal ${pickupSheet?.cellWidth ?? 320}x${pickupSheet?.cellHeight ?? 360} cells. One large centered collectible icon per cell with a complete silhouette. Row-major order: ${pickups}. No text, labels, frames, or overlap. ${negative}`],
  ];
  console.log(`# ${region.name} asset prompts\n`);
  for (const [title, prompt] of promptList) console.log(`## ${title}\n${prompt}\n`);
}

function scaffold(id, name) {
  if (!/^[a-z0-9-]+$/.test(id ?? "")) throw new Error("scaffold id must be lowercase kebab-case");
  if (!name) throw new Error("scaffold requires a display name");
  const source = readManifest("verdant-rift").region;
  source.id = id;
  source.name = name;
  source.shortName = name.toUpperCase();
  source.creativeBrief.theme = `Describe the central fantasy of ${name}.`;
  source.creativeBrief.environment = `Describe the two connected environments in ${name}.`;
  source.creativeBrief.palette = "Define 4-6 dominant colors.";
  for (const sheet of source.assets.sheets) sheet.cellHeight = 320;
  const target = path.join(regionsDir, `${id}.json`);
  if (fs.existsSync(target)) throw new Error(`region already exists: ${target}`);
  fs.writeFileSync(target, `${JSON.stringify(source, null, 2)}\n`);
  const assetDir = path.join(root, "public", "assets", "wilds", "regions", id);
  for (const folder of ["backgrounds", "creatures", "scenery", "pickups"]) fs.mkdirSync(path.join(assetDir, folder), { recursive: true });

  const symbol = `${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^[a-z]/, (letter) => letter.toUpperCase())}Region`;
  const catalogFile = path.join(regionsDir, "index.ts");
  let catalog = fs.readFileSync(catalogFile, "utf8");
  const importLine = `import ${symbol} from "./${id}.json";`;
  catalog = catalog.replace(/(import verdantRift[^\n]+\n)/, `$1${importLine}\n`);
  catalog = catalog.replace("[validateRegionManifest(verdantRift)]", `[validateRegionManifest(verdantRift), validateRegionManifest(${symbol})]`);
  fs.writeFileSync(catalogFile, catalog);
  console.log(`Created and registered ${path.relative(root, target)}.`);
  console.log(`Asset folders: ${path.relative(root, assetDir)}`);
  console.log(`Preview: /capsule/wilds?region=${id}`);
  console.log("Replace the cloned content and assets, then run wilds:validate.");
}

try {
  const [command = "validate", input, ...rest] = process.argv.slice(2);
  if (command === "validate") {
    const files = input ? [resolveManifest(input)] : fs.readdirSync(regionsDir).filter((file) => file.endsWith(".json")).map((file) => path.join(regionsDir, file));
    for (const file of files) {
      const region = JSON.parse(fs.readFileSync(file, "utf8"));
      validate(region, file);
    }
  } else if (command === "prompts") {
    prompts(readManifest(input).region);
  } else if (command === "scaffold") {
    scaffold(input, rest.join(" "));
  } else {
    fail("use validate [region], prompts [region], or scaffold <id> <name>");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
