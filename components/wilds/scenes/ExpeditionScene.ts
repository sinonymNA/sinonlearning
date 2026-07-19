import Phaser from "phaser";
import { appendToCollection, grantCoins, registerBattleWin, registerRunComplete } from "../save";
import { REGISTRY_KEYS } from "../gameState";
import { wildsText } from "../Presentation";
import type { WildsAudioManager, WildsSoundKey } from "../WildsAudio";

type ThingKind = "wild" | "coin" | "heal" | "shield" | "power" | "lucky" | "hint" | "gate";
type RoomKind = "arrival" | "encounter" | "reward" | "rest" | "rare" | "treasure" | "boss";
type WorldThing = {
  kind: ThingKind;
  creatureId?: string;
  sprite: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
  used: boolean;
  magneting?: boolean;
};

const EASY_QUESTIONS = [
  { prompt: "What is 2 + 3?", choices: ["4", "5", "6", "7"], answer: 1 },
  { prompt: "Which color is the sky on a clear day?", choices: ["Blue", "Green", "Pink", "Orange"], answer: 0 },
  { prompt: "How many legs does a dog have?", choices: ["2", "3", "4", "5"], answer: 2 },
  { prompt: "What shape has three sides?", choices: ["Circle", "Triangle", "Square", "Star"], answer: 1 },
  { prompt: "Which animal says meow?", choices: ["Dog", "Bird", "Cat", "Fish"], answer: 2 },
  { prompt: "What is 10 - 4?", choices: ["5", "6", "7", "8"], answer: 1 },
  { prompt: "Which season comes after spring?", choices: ["Winter", "Summer", "Fall", "Night"], answer: 1 },
  { prompt: "How many days are in a week?", choices: ["5", "6", "7", "8"], answer: 2 },
  { prompt: "What do plants get from sunlight?", choices: ["Energy", "Snow", "Sound", "Sand"], answer: 0 },
  { prompt: "Which is a fruit?", choices: ["Carrot", "Apple", "Potato", "Bread"], answer: 1 },
  { prompt: "What is 4 + 4?", choices: ["6", "7", "8", "9"], answer: 2 },
  { prompt: "Which word means very large?", choices: ["Tiny", "Huge", "Quiet", "Slow"], answer: 1 },
];

const CREATURES = [
  { id: "sparkit", name: "Sparkit", rarity: "common", rate: 0.82, hp: 2 },
  { id: "mossprout", name: "Mossprout", rarity: "common", rate: 0.82, hp: 2 },
  { id: "aquablob", name: "Aquablob", rarity: "common", rate: 0.82, hp: 2 },
  { id: "pebblit", name: "Pebblit", rarity: "common", rate: 0.78, hp: 2 },
  { id: "thornpaw", name: "Thornpaw", rarity: "rare", rate: 0.55, hp: 3 },
  { id: "galehawk", name: "Galehawk", rarity: "rare", rate: 0.55, hp: 3 },
  { id: "lumimoth", name: "Lumimoth", rarity: "rare", rate: 0.55, hp: 3 },
  { id: "brookhorn", name: "Brookhorn", rarity: "rare", rate: 0.5, hp: 3 },
  { id: "crystal_drake", name: "Crystal Drake", rarity: "epic", rate: 0.3, hp: 4 },
  { id: "nightfang", name: "Nightfang", rarity: "epic", rate: 0.3, hp: 4 },
  { id: "sun_stag", name: "Sun Stag", rarity: "epic", rate: 0.3, hp: 4 },
  { id: "warden_wisp", name: "Warden Wisp", rarity: "boss", rate: 1, hp: 6 },
] as const;

const ROOM_PLAN: RoomKind[] = ["arrival", "encounter", "reward", "encounter", "rest", "rare", "encounter", "treasure", "boss"];
const ROOM_NAMES = ["Rift Landing", "Mosslight Path", "Crystal Cache", "Whispering Stones", "Sunwell Rest", "Ancient Grove", "Ruin Crossing", "Warden's Hoard", "Rift Heart"];
const rarityColor: Record<string, string> = { common: "#d9fff0", rare: "#8ce6ff", epic: "#e1b6ff", boss: "#ffcf79" };
const FLOOR_Y = 820;
const PLAYER_SIZE = 112;
const EXIT_X = 1760;

export class ExpeditionScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private eHandler = () => this.tryInteract();
  private things: WorldThing[] = [];
  private roomVisuals: Phaser.GameObjects.GameObject[] = [];
  private background!: Phaser.GameObjects.Image;
  private exitPortal!: Phaser.GameObjects.Container;
  private targetMarker!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Text;
  private roomLabel!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private touchBattleButton!: Phaser.GameObjects.Rectangle;
  private touchBattleLabel!: Phaser.GameObjects.Text;
  private joystick = { active: false, x: 0 };
  private interactTarget: WorldThing | null = null;
  private promptMessage = "";
  private promptClearAt = 0;
  private roomIndex = 0;
  private roomResolved = false;
  private transitioning = false;
  private battleOpen = false;
  private questionDeck = Phaser.Utils.Array.Shuffle([...EASY_QUESTIONS]);
  private questionIndex = 0;
  private hp = 5;
  private coins = 0;
  private captures = 0;
  private power = 0;
  private shield = 0;
  private lucky = 0;
  private hints = 0;
  private trailCooldown = 0;

  constructor() {
    super({ key: "ExpeditionScene" });
  }

  create() {
    this.cameras.main.fadeIn(280, 4, 18, 28);
    this.physics.world.setBounds(0, 0, 1920, 1080);
    this.physics.world.gravity.y = 1900;
    this.createBackground(this.backgroundKeyFor(0));
    this.createGround();
    this.createPlayer();
    this.createHud();
    this.createTargetMarker();
    this.createTouchControls();
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("A,D,E") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-E", this.eHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off("keydown-E", this.eHandler));
    this.buildRoom(0);
  }

  update(_: number, delta: number) {
    this.updatePromptState();
    if (this.battleOpen || this.transitioning) return;

    let direction = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) direction -= 1;
    if (this.keys.right.isDown || this.wasd.D.isDown) direction += 1;
    if (this.joystick.active) direction += this.joystick.x;
    direction = Phaser.Math.Clamp(direction, -1, 1);

    if (direction !== 0) {
      this.player.setAccelerationX(direction * 3000);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, direction * 7, 0.2));
      this.trailCooldown -= delta;
      if (this.trailCooldown <= 0 && Math.abs(this.player.body!.velocity.x) > 120) {
        this.makeTrail();
        this.trailCooldown = 95;
      }
    } else {
      this.player.setAccelerationX(0);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, 0, 0.18));
    }

    const speed = Math.abs(this.player.body!.velocity.x);
    const stretch = Phaser.Math.Clamp(speed / 550, 0, 1);
    this.player.setDisplaySize(PLAYER_SIZE + stretch * 8, PLAYER_SIZE - stretch * 4);
    this.playerShadow.setPosition(this.player.x, FLOOR_Y + 3).setScale(1 + stretch * 0.18, 1).setAlpha(0.22 + stretch * 0.1);
    this.background.x = 960 + (960 - this.player.x) * 0.025;

    this.updatePickups(delta);
    this.findInteractTarget();
    this.updateExitPortal();
    this.refreshHud();

    if (this.player.x >= EXIT_X - 70) {
      if (this.roomResolved) this.advanceRoom();
      else {
        this.player.x = EXIT_X - 74;
        this.player.setVelocityX(Math.min(0, this.player.body!.velocity.x));
        this.showPrompt("A Wild blocks the path. Win the battle to open the trail.", 1100);
      }
    }
  }

  private createBackground(key: string) {
    this.background = this.add.image(960, 540, key).setDisplaySize(2050, 1080).setDepth(-20);
    this.add.rectangle(960, 540, 1920, 1080, 0x031421, 0.08).setDepth(-19);
    this.add.rectangle(960, 994, 1920, 172, 0x03151a, 0.18).setDepth(1);
  }

  private createGround() {
    this.ground = this.physics.add.staticGroup();
    const floor = this.add.rectangle(960, FLOOR_Y + 64, 1920, 36, 0x000000, 0);
    this.physics.add.existing(floor, true);
    this.ground.add(floor);
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(240, FLOOR_Y + 4, 104, 24, 0x03121a, 0.28).setDepth(7);
    this.player = this.physics.add.image(240, FLOOR_Y - 58, "wilds-player-cap-round").setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(10);
    this.player.setCircle(104, 24, 24).setDragX(2350).setMaxVelocity(490, 1200).setBounce(0.03).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.ground);
  }

  private createHud() {
    this.add.rectangle(330, 74, 570, 104, 0x06182a, 0.82).setDepth(30).setStrokeStyle(2, 0x8cf8dd, 0.4);
    this.add.rectangle(330, 112, 500, 10, 0x0a3042, 0.95).setDepth(31);
    this.progressFill = this.add.rectangle(80, 112, 0, 10, 0x79f5c9, 1).setOrigin(0, 0.5).setDepth(32);
    this.hud = wildsText(this, 80, 35, "", 18, "#f5fffb", { lineSpacing: 6 }).setDepth(32);
    this.roomLabel = wildsText(this, 960, 48, "", 24, "#f1fff8", { align: "center" }).setOrigin(0.5).setDepth(31);
    this.prompt = wildsText(this, 960, 958, "", 20, "#ffffff", { align: "center", wordWrap: { width: 900 } }).setOrigin(0.5).setDepth(40);
  }

  private createTargetMarker() {
    const glow = this.add.circle(0, 0, 54, 0x65ffd4, 0.08).setStrokeStyle(3, 0xcaffed, 0.8);
    const arrow = this.add.triangle(0, -72, 0, 0, 25, 32, -25, 32, 0xcaffed, 0.95).setStrokeStyle(2, 0x06182a, 0.8);
    const label = wildsText(this, 0, 66, "BATTLE", 12, "#ffffff").setOrigin(0.5);
    this.targetMarker = this.add.container(0, 0, [glow, arrow, label]).setDepth(25).setVisible(false);
    this.tweens.add({ targets: this.targetMarker, y: "-=8", duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createTouchControls() {
    const isTouch = window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1100;
    const base = this.add.circle(140, 910, 72, 0x06182a, 0.68).setStrokeStyle(3, 0xa6f8e3, 0.58).setDepth(45).setInteractive().setVisible(isTouch);
    const knob = this.add.circle(140, 910, 28, 0x8ff7dd, 0.88).setDepth(46).setVisible(isTouch);
    this.touchBattleButton = this.add.rectangle(1740, 910, 210, 104, 0x16ac80, 0.92).setStrokeStyle(3, 0xdcfff4, 0.8).setDepth(45).setInteractive({ useHandCursor: true }).setVisible(isTouch);
    this.touchBattleLabel = wildsText(this, 1740, 910, "BATTLE", 19).setOrigin(0.5).setDepth(46).setVisible(isTouch);
    this.setBattleButtonActive(false);

    const updateStick = (pointer: Phaser.Input.Pointer) => {
      const dx = Phaser.Math.Clamp(pointer.x - 140, -54, 54);
      knob.x = 140 + dx;
      this.joystick = { active: true, x: dx / 54 };
    };
    base.on("pointerdown", updateStick);
    base.on("pointermove", (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) updateStick(pointer); });
    this.input.on("pointerup", () => { this.joystick = { active: false, x: 0 }; knob.x = 140; });
    this.touchBattleButton.on("pointerup", () => this.tryInteract());
  }

  private buildRoom(index: number) {
    this.roomIndex = index;
    this.roomResolved = false;
    this.roomLabel.setText(`ROOM ${index + 1} / ${ROOM_PLAN.length}  •  ${ROOM_NAMES[index]}`);
    this.spawnScenery(index);
    const kind = ROOM_PLAN[index];

    if (kind === "arrival") {
      this.roomResolved = true;
      this.spawnPickup(900, "coin");
      this.spawnPickup(1220, "shield");
      this.showPrompt("Move with A/D or the arrow keys. Collect supplies and reach the glowing trail.", 4200, true);
    } else if (kind === "reward") {
      this.roomResolved = true;
      this.spawnPickup(820, "coin");
      this.spawnPickup(1110, Phaser.Utils.Array.GetRandom(["power", "hint", "shield"]));
      this.spawnPickup(1390, "coin");
      this.showPrompt("A crystal cache! Supplies pull toward your cap when you get close.", 2600, true);
    } else if (kind === "rest") {
      this.roomResolved = true;
      this.spawnPickup(1030, "heal");
      this.spawnPickup(1320, "lucky");
      this.showPrompt("The Sunwell is safe. Recover before entering the ancient grove.", 2600, true);
    } else if (kind === "treasure") {
      this.roomResolved = true;
      this.spawnPickup(760, "coin");
      this.spawnPickup(1030, "power");
      this.spawnPickup(1290, "coin");
      this.spawnPickup(1510, "hint");
      this.showPrompt("The Warden's hoard. Gather what you need for the final battle.", 2600, true);
    } else if (kind === "boss") {
      this.spawnWild(1320, "warden_wisp");
      this.playAudio("boss-appear");
      this.showPrompt("Warden Wisp guards the Rift Heart. Approach and press E to battle.", 3200, true);
    } else {
      this.spawnWild(1260, this.pickCreature(kind === "rare"));
      if (kind === "rare") this.spawnPickup(760, "lucky");
      this.showPrompt(kind === "rare" ? "A powerful Wild is nearby. Prepare before approaching." : "A Wild is blocking the trail. Approach and press E to battle.", 2600, true);
    }

    this.createExitPortal();
    this.refreshHud();
  }

  private spawnScenery(roomIndex: number) {
    const propKeys = ["prop_grass", "prop_flowers", "prop_mushrooms", "prop_crystal", "prop_rock", "prop_pillar", "prop_ruin", "prop_bush", "prop_log", "prop_rune"];
    const slots = [
      { x: 390, y: 760, size: 122 },
      { x: 700, y: 705, size: 102 },
      { x: 1040, y: 745, size: 116 },
      { x: 1580, y: 748, size: 124 },
    ];
    const shuffled = Phaser.Utils.Array.Shuffle([...propKeys]);
    slots.forEach((slot, index) => {
      if ((roomIndex + index) % 4 === 0 && index === 2) return;
      const prop = this.add.image(slot.x, slot.y, shuffled[index]).setDisplaySize(slot.size, slot.size).setDepth(slot.y > 730 ? 8 : 3).setAlpha(0);
      this.roomVisuals.push(prop);
      this.tweens.add({ targets: prop, alpha: 0.94, y: slot.y - 5, duration: 380, delay: index * 55, ease: "Back.easeOut" });
    });
  }

  private spawnWild(x: number, creatureId: string) {
    const creature = CREATURES.find((entry) => entry.id === creatureId)!;
    const y = FLOOR_Y - 68;
    const sprite = this.add.image(x, y, `field_${creature.id}`).setDisplaySize(creature.rarity === "boss" ? 190 : 150, creature.rarity === "boss" ? 190 : 150).setDepth(11).setAlpha(0);
    const label = wildsText(this, x, y - 112, `${creature.rarity.toUpperCase()}  •  ${creature.name}`, 14, rarityColor[creature.rarity]).setOrigin(0.5).setDepth(13).setAlpha(0);
    this.roomVisuals.push(sprite, label);
    this.things.push({ kind: creature.rarity === "boss" ? "gate" : "wild", creatureId: creature.id, sprite, label, used: false });
    this.tweens.add({ targets: [sprite, label], alpha: 1, duration: 360, ease: "Sine.easeOut" });
    this.tweens.add({ targets: sprite, y: y - 8, duration: 980, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private spawnPickup(x: number, kind: ThingKind) {
    const sprite = this.add.image(x, FLOOR_Y - 82, `pickup_${kind}`).setDisplaySize(78, 90).setDepth(12).setAlpha(0);
    this.roomVisuals.push(sprite);
    this.things.push({ kind, sprite, used: false });
    this.tweens.add({ targets: sprite, alpha: 1, duration: 260 });
    this.tweens.add({ targets: sprite, y: FLOOR_Y - 94, duration: 820, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createExitPortal() {
    const glow = this.add.ellipse(0, 0, 110, 210, 0x5bf3cd, 0.08).setStrokeStyle(4, 0xb9ffed, 0.65);
    const arrowOne = this.add.triangle(-12, -24, 0, 0, 34, 28, 0, 56, 0xb9ffed, 0.82);
    const arrowTwo = this.add.triangle(20, -24, 0, 0, 34, 28, 0, 56, 0x53d9c5, 0.72);
    const text = wildsText(this, 0, 126, "NEXT", 13, "#dffff7").setOrigin(0.5);
    this.exitPortal = this.add.container(1790, FLOOR_Y - 105, [glow, arrowOne, arrowTwo, text]).setDepth(15).setAlpha(this.roomResolved ? 1 : 0.2);
    this.roomVisuals.push(this.exitPortal);
    this.tweens.add({ targets: glow, scaleX: 1.2, alpha: 0.2, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private updateExitPortal() {
    if (!this.exitPortal) return;
    const targetAlpha = this.roomResolved ? 1 : 0.18;
    this.exitPortal.setAlpha(Phaser.Math.Linear(this.exitPortal.alpha, targetAlpha, 0.08));
  }

  private advanceRoom() {
    if (this.transitioning || this.roomIndex >= ROOM_PLAN.length - 1) return;
    this.transitioning = true;
    this.player.setAccelerationX(0).setVelocityX(0);
    this.targetMarker.setVisible(false);
    const nextIndex = this.roomIndex + 1;
    const oldBackground = this.background;
    const nextBackground = this.add.image(2880, 540, this.backgroundKeyFor(nextIndex)).setDisplaySize(2050, 1080).setDepth(-20);
    const wipe = this.add.rectangle(2200, 540, 320, 1180, 0x72ffe0, 0.22).setDepth(50).setRotation(0.08);
    this.playAudio("map-move");
    this.tweens.add({ targets: this.roomVisuals, x: "-=460", alpha: 0, duration: 470, ease: "Cubic.easeIn" });
    this.tweens.add({ targets: oldBackground, x: -960, duration: 650, ease: "Cubic.easeInOut" });
    this.tweens.add({ targets: nextBackground, x: 960, duration: 650, ease: "Cubic.easeInOut" });
    this.tweens.add({ targets: wipe, x: -280, duration: 650, ease: "Cubic.easeInOut", onComplete: () => wipe.destroy() });
    this.tweens.add({ targets: [this.player, this.playerShadow], alpha: 0, duration: 220, yoyo: true, hold: 210 });
    this.time.delayedCall(330, () => {
      this.clearRoomObjects();
      oldBackground.destroy();
      this.background = nextBackground;
      this.player.setPosition(220, FLOOR_Y - 58).setAlpha(1);
      this.playerShadow.setPosition(220, FLOOR_Y + 4).setAlpha(0.28);
      this.buildRoom(nextIndex);
    });
    this.time.delayedCall(680, () => {
      this.transitioning = false;
      this.showPrompt(`${ROOM_NAMES[nextIndex]} discovered`, 1300, true);
    });
  }

  private clearRoomObjects() {
    this.roomVisuals.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.roomVisuals = [];
    this.things = [];
    this.interactTarget = null;
  }

  private findInteractTarget() {
    const nearest = this.things
      .filter((thing) => !thing.used && (thing.kind === "wild" || thing.kind === "gate"))
      .map((thing) => ({ thing, distance: Math.abs(this.player.x - thing.sprite.x) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.interactTarget = nearest && nearest.distance < 175 ? nearest.thing : null;
    if (!this.interactTarget) {
      this.targetMarker.setVisible(false);
      this.setBattleButtonActive(false);
      return;
    }
    this.targetMarker.setVisible(true).setPosition(this.interactTarget.sprite.x, this.interactTarget.sprite.y - 128);
    this.setBattleButtonActive(true);
    this.showPrompt("Press E or BATTLE to challenge this Wild.", 650);
  }

  private updatePickups(delta: number) {
    const pull = Phaser.Math.Clamp(delta / 1000 * 8, 0, 0.3);
    for (const thing of this.things) {
      if (thing.used || thing.kind === "wild" || thing.kind === "gate") continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, thing.sprite.x, thing.sprite.y);
      if (distance < 210) {
        if (!thing.magneting) this.tweens.killTweensOf(thing.sprite);
        thing.magneting = true;
        thing.sprite.x = Phaser.Math.Linear(thing.sprite.x, this.player.x, pull);
        thing.sprite.y = Phaser.Math.Linear(thing.sprite.y, this.player.y, pull);
      }
      if (distance < 68) this.collectPickup(thing);
    }
  }

  private setBattleButtonActive(active: boolean) {
    if (!this.touchBattleButton || !this.touchBattleLabel) return;
    this.touchBattleButton.setAlpha(active ? 0.94 : 0.28);
    this.touchBattleLabel.setAlpha(active ? 1 : 0.4);
  }

  private tryInteract() {
    if (!this.interactTarget || this.battleOpen || this.transitioning) return;
    this.startBattle(this.interactTarget);
  }

  private collectPickup(target: WorldThing) {
    if (target.used) return;
    target.used = true;
    this.tweens.killTweensOf(target.sprite);
    this.burst(target.sprite.x, target.sprite.y, target.kind === "heal" ? 0xff91a4 : 0x8fffe4);
    this.floatText(target.sprite.x, target.sprite.y - 54, target.kind === "coin" ? "+8" : target.kind.toUpperCase(), target.kind === "coin" ? "#ffdf74" : "#bfffee");
    target.sprite.destroy();
    this.playAudio("item-use");
    if (target.kind === "coin") { this.coins += 8; this.showPrompt("+8 Wild Coins", 1000, true); }
    if (target.kind === "heal") { this.hp = Math.min(5, this.hp + 1); this.showPrompt("Healing Capsule: +1 heart", 1000, true); }
    if (target.kind === "shield") { this.shield += 1; this.showPrompt("Shield Capsule ready", 1000, true); }
    if (target.kind === "power") { this.power += 1; this.showPrompt("Power Capsule ready", 1000, true); }
    if (target.kind === "lucky") { this.lucky += 0.2; this.showPrompt("Lucky Capsule: capture chance increased", 1000, true); }
    if (target.kind === "hint") { this.hints += 1; this.showPrompt("Hint Scroll ready", 1000, true); }
  }

  private startBattle(target: WorldThing) {
    const creature = CREATURES.find((entry) => entry.id === target.creatureId)!;
    this.battleOpen = true;
    this.player.setAccelerationX(0).setVelocityX(0);
    this.targetMarker.setVisible(false);
    let enemyHp: number = creature.hp;
    const maxEnemyHp = creature.hp;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(object: T) => { objects.push(object); return object; };
    const bg = add(this.add.image(960, 540, "verdant-battle-bg").setDisplaySize(1920, 1080).setDepth(60));
    add(this.add.rectangle(960, 540, 1920, 1080, 0x03111f, 0.5).setDepth(61));
    const playerPortrait = add(this.add.image(420, 350, "wilds-player-cap-round").setDisplaySize(230, 230).setDepth(63));
    const enemyPortrait = add(this.add.image(1500, 345, `field_${creature.id}`).setDisplaySize(280, 280).setDepth(63));
    add(this.add.image(410, 120, "battle_hp_player_frame").setDisplaySize(620, 132).setDepth(63));
    add(this.add.image(1510, 120, "battle_hp_enemy_frame").setDisplaySize(620, 132).setDepth(63));
    const playerBar = add(this.add.rectangle(205, 138, 410 * (this.hp / 5), 18, 0x4ee29b, 1).setOrigin(0, 0.5).setDepth(64));
    const enemyBar = add(this.add.rectangle(1305, 138, 410, 18, 0xff796f, 1).setOrigin(0, 0.5).setDepth(64));
    const playerHpText = add(wildsText(this, 410, 105, `YOUR CAP  •  ${this.hp}/5`, 19, "#eafff7").setOrigin(0.5).setDepth(65));
    const enemyHpText = add(wildsText(this, 1510, 105, `${creature.name.toUpperCase()}  •  ${enemyHp}/${maxEnemyHp}`, 19, rarityColor[creature.rarity]).setOrigin(0.5).setDepth(65));
    add(this.add.image(960, 500, "battle_question_panel").setDisplaySize(1120, 240).setDepth(63));
    const questionText = add(wildsText(this, 960, 470, "", 29, "#ffffff", { align: "center", wordWrap: { width: 900 } }).setOrigin(0.5).setDepth(65));
    const feedback = add(wildsText(this, 960, 550, "Choose the right answer to attack.", 20, "#d9fff5", { align: "center" }).setOrigin(0.5).setDepth(65));
    const buttons: Phaser.GameObjects.Container[] = [];
    const textures = ["battle_answer_button_green", "battle_answer_button_blue", "battle_answer_button_purple", "battle_answer_button_gold"];
    let keyHandler: ((event: KeyboardEvent) => void) | null = null;
    const clearKeys = () => { if (keyHandler) this.input.keyboard!.off("keydown", keyHandler); keyHandler = null; };
    const close = () => { clearKeys(); objects.forEach((object) => object.destroy()); this.battleOpen = false; };

    const showQuestion = () => {
      clearKeys();
      if (this.questionIndex >= this.questionDeck.length) {
        this.questionDeck = Phaser.Utils.Array.Shuffle([...EASY_QUESTIONS]);
        this.questionIndex = 0;
      }
      const question = this.questionDeck[this.questionIndex++];
      const useHint = this.hints > 0;
      if (useHint) this.hints -= 1;
      questionText.setText(question.prompt);
      feedback.setColor("#d9fff5").setText(useHint ? "Hint active: two choices have faded." : "Choose the right answer to attack.");
      const wrong = [0, 1, 2, 3].filter((choice) => choice !== question.answer);
      buttons.forEach((button, index) => {
        button.removeAllListeners("pointerup");
        const label = button.getData("label") as Phaser.GameObjects.Text;
        const hidden = useHint && wrong.slice(0, 2).includes(index);
        label.setText(`${index + 1}. ${question.choices[index]}`);
        button.setAlpha(hidden ? 0.2 : 1).setActive(!hidden);
        if (hidden) button.disableInteractive();
        else button.setInteractive({ useHandCursor: true });
        button.once("pointerup", () => {
          clearKeys();
          buttons.forEach((item) => item.disableInteractive());
          if (index === question.answer) {
            const damage = this.power > 0 ? 2 : 1;
            this.power = Math.max(0, this.power - 1);
            enemyHp = Math.max(0, enemyHp - damage);
            enemyBar.width = 410 * (enemyHp / maxEnemyHp);
            enemyHpText.setText(`${creature.name.toUpperCase()}  •  ${enemyHp}/${maxEnemyHp}`);
            feedback.setColor("#9dffcf").setText(`Correct! ${creature.name} takes ${damage} damage.`);
            this.playAudio("correct");
            this.playAudio("hit");
            this.burst(enemyPortrait.x, enemyPortrait.y, 0xffde78);
            this.tweens.add({ targets: enemyPortrait, x: enemyPortrait.x + 34, alpha: 0.45, duration: 80, yoyo: true, repeat: 2 });
          } else if (this.shield > 0) {
            this.shield -= 1;
            feedback.setColor("#8ce6ff").setText("Not quite, but your shield blocks the attack.");
            this.playAudio("wrong");
            this.burst(playerPortrait.x, playerPortrait.y, 0x77e8ff);
          } else {
            this.hp = Math.max(0, this.hp - 1);
            playerBar.width = 410 * (this.hp / 5);
            playerHpText.setText(`YOUR CAP  •  ${this.hp}/5`);
            feedback.setColor("#ffb5b5").setText("Not quite. You lose 1 heart; the Wild takes no damage.");
            this.playAudio("wrong");
            this.playAudio("player-hit");
            this.cameras.main.shake(140, 0.004);
            this.tweens.add({ targets: playerPortrait, x: playerPortrait.x - 30, alpha: 0.5, duration: 80, yoyo: true, repeat: 2 });
          }

          if (enemyHp <= 0) this.time.delayedCall(820, () => { close(); this.resolveCapture(target, creature); });
          else if (this.hp <= 0) this.time.delayedCall(900, () => { close(); this.finishRun(false); });
          else this.time.delayedCall(820, showQuestion);
        });
      });
      keyHandler = (event: KeyboardEvent) => {
        const answer = ["1", "2", "3", "4"].indexOf(event.key);
        if (answer >= 0 && buttons[answer]?.active) buttons[answer].emit("pointerup");
      };
      this.input.keyboard!.on("keydown", keyHandler);
    };

    [0, 1, 2, 3].forEach((index) => {
      const x = index % 2 === 0 ? 650 : 1270;
      const y = index < 2 ? 755 : 905;
      const image = this.add.image(0, 0, textures[index]).setDisplaySize(530, 126);
      const label = wildsText(this, 0, 0, "", 21, "#ffffff", { align: "center", wordWrap: { width: 420 } }).setOrigin(0.5);
      const hitbox = this.add.rectangle(0, 0, 530, 126, 0xffffff, 0.001);
      const button = this.add.container(x, y, [image, label, hitbox]).setSize(530, 126).setDepth(65);
      button.setData("label", label);
      button.on("pointerover", () => this.tweens.add({ targets: button, scale: 1.025, duration: 90 }));
      button.on("pointerout", () => button.setScale(1));
      buttons.push(button);
      objects.push(button);
    });
    bg.setAlpha(0);
    this.tweens.add({ targets: objects, alpha: 1, duration: 220 });
    showQuestion();
  }

  private resolveCapture(target: WorldThing, creature: typeof CREATURES[number]) {
    target.used = true;
    target.label?.destroy();
    target.sprite.destroy();
    const chance = Math.min(0.95, creature.rate + this.lucky);
    const success = Math.random() < chance;
    this.lucky = 0;
    this.coins += creature.rarity === "boss" ? 45 : creature.rarity === "epic" ? 25 : creature.rarity === "rare" ? 16 : 10;
    registerBattleWin();
    this.playCaptureMoment(creature, chance, success, () => {
      if (success) {
        appendToCollection(creature.id);
        this.captures += 1;
        this.playAudio("capture-success");
        this.showPrompt(`${creature.name} joined your Verdant Rift collection!`, 2200, true);
      } else {
        this.playAudio("capture-fail");
        this.showPrompt(`${creature.name} escaped, but you earned Wild Coins.`, 2200, true);
      }
      this.roomResolved = true;
      if (creature.id === "warden_wisp") this.time.delayedCall(900, () => this.finishRun(true));
      else this.showPrompt("The trail is open. Continue to the next room.", 1800, true);
    });
  }

  private finishRun(victory: boolean) {
    grantCoins(this.coins);
    if (victory) registerRunComplete();
    this.battleOpen = true;
    this.playAudio(victory ? "victory" : "defeat");
    this.add.rectangle(960, 540, 1920, 1080, 0x03101a, 0.9).setDepth(90);
    const panel = this.add.image(960, 535, "results_reward_panel").setDisplaySize(940, 491).setDepth(91);
    const badge = this.add.image(960, 240, victory ? "results_victory_badge" : "results_defeat_badge").setDisplaySize(300, 163).setDepth(93);
    const heading = wildsText(this, 960, 440, victory ? "VERDANT RIFT CLEARED!" : "EXPEDITION OVER", 36, victory ? "#b7ffe7" : "#ffd1d1").setOrigin(0.5).setDepth(94);
    const stats = wildsText(this, 960, 580, `Rooms explored: ${this.roomIndex + 1}/${ROOM_PLAN.length}\nWilds captured: ${this.captures}\nCoins earned: ${this.coins}\n${victory ? "Warden Wisp has opened the path to future regions." : "Your captures and coins are safely kept."}`, 23, "#ffffff", { align: "center", lineSpacing: 10, wordWrap: { width: 700 } }).setOrigin(0.5).setDepth(94);
    const replay = this.add.image(790, 815, "results_continue_button").setDisplaySize(340, 98).setDepth(94).setInteractive({ useHandCursor: true });
    const titleButton = this.add.graphics().setDepth(94);
    titleButton.fillStyle(0x237fc2, 1).lineStyle(4, 0xc9f4ff, 0.88).fillRoundedRect(980, 753, 320, 124, 38).strokeRoundedRect(980, 753, 320, 124, 38);
    titleButton.setInteractive(new Phaser.Geom.Rectangle(980, 753, 320, 124), Phaser.Geom.Rectangle.Contains);
    if (titleButton.input) titleButton.input.cursor = "pointer";
    const titleLabel = wildsText(this, 1140, 815, "TITLE", 25).setOrigin(0.5).setDepth(95);
    [panel, badge, heading, stats, replay, titleButton, titleLabel].forEach((object) => object.setAlpha(0));
    this.tweens.add({ targets: [panel, heading, stats, replay, titleButton, titleLabel], alpha: 1, duration: 360, ease: "Sine.easeOut" });
    this.tweens.add({ targets: badge, alpha: 1, y: 255, duration: 520, ease: "Back.easeOut" });
    replay.on("pointerover", () => replay.setScale(1.035)).on("pointerout", () => replay.setScale(1));
    replay.on("pointerup", () => this.scene.restart());
    titleButton.on("pointerup", () => this.scene.start("TitleScene"));
  }

  private refreshHud() {
    this.hud.setText(`VERDANT RIFT  •  HP ${this.hp}/5\nCoins ${this.coins}   Catches ${this.captures}   Shield ${this.shield}   Power ${this.power}`);
    this.progressFill.width = ((this.roomIndex + (this.roomResolved ? 1 : 0.45)) / ROOM_PLAN.length) * 500;
  }

  private showPrompt(message: string, duration = 1600, force = false) {
    if (!force && this.promptMessage === message) {
      this.promptClearAt = Math.max(this.promptClearAt, this.time.now + duration);
      return;
    }
    this.promptMessage = message;
    this.prompt.setText(message).setAlpha(1);
    this.promptClearAt = this.time.now + duration;
  }

  private updatePromptState() {
    if (!this.promptMessage || this.time.now < this.promptClearAt) return;
    this.promptMessage = "";
    this.tweens.add({ targets: this.prompt, alpha: 0, duration: 220, onComplete: () => this.prompt.setText("") });
  }

  private pickCreature(rareRoom: boolean) {
    const progress = this.roomIndex / (ROOM_PLAN.length - 1);
    const common = CREATURES.filter((creature) => creature.rarity === "common");
    const rare = CREATURES.filter((creature) => creature.rarity === "rare");
    const epic = CREATURES.filter((creature) => creature.rarity === "epic");
    if (rareRoom && Math.random() < 0.25 + progress * 0.3) return Phaser.Utils.Array.GetRandom(epic).id;
    if (rareRoom || Math.random() < 0.18 + progress * 0.2) return Phaser.Utils.Array.GetRandom(rare).id;
    return Phaser.Utils.Array.GetRandom(common).id;
  }

  private backgroundKeyFor(index: number) {
    if (ROOM_PLAN[index] === "boss") return "expedition-gate";
    return index % 2 === 0 ? "expedition-meadow" : "expedition-crystal";
  }

  private makeTrail() {
    const trail = this.add.circle(this.player.x - Math.sign(this.player.body!.velocity.x) * 38, FLOOR_Y - 8, Phaser.Math.Between(4, 8), 0xb4fff0, 0.55).setDepth(8);
    this.tweens.add({ targets: trail, y: trail.y - 20, alpha: 0, scale: 2, duration: 420, onComplete: () => trail.destroy() });
  }

  private floatText(x: number, y: number, message: string, color = "#ffffff") {
    const text = wildsText(this, x, y, message, 20, color).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: text, y: y - 48, alpha: 0, scale: 1.15, duration: 700, ease: "Cubic.easeOut", onComplete: () => text.destroy() });
  }

  private burst(x: number, y: number, color: number) {
    for (let index = 0; index < 12; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 8), color, 0.92).setDepth(80);
      this.tweens.add({ targets: dot, x: x + Phaser.Math.Between(-105, 105), y: y + Phaser.Math.Between(-85, 70), alpha: 0, scale: 0.2, duration: Phaser.Math.Between(360, 620), onComplete: () => dot.destroy() });
    }
  }

  private playCaptureMoment(creature: typeof CREATURES[number], chance: number, success: boolean, onDone: () => void) {
    const shade = this.add.rectangle(960, 540, 1920, 1080, 0x031624, 0.72).setDepth(70);
    const cap = this.add.image(960, 700, "wilds-player-cap-round").setDisplaySize(150, 150).setDepth(72);
    const target = this.add.image(960, 300, `field_${creature.id}`).setDisplaySize(250, 250).setDepth(72);
    const label = wildsText(this, 960, 850, `CAPTURE CHANCE ${Math.round(chance * 100)}%`, 25, rarityColor[creature.rarity]).setOrigin(0.5).setDepth(73);
    this.tweens.add({ targets: cap, y: 390, scale: 0.58, duration: 520, ease: "Quad.easeIn" });
    this.tweens.add({ targets: target, y: 390, scale: 0.08, alpha: 0, duration: 620, delay: 170, ease: "Quad.easeIn" });
    this.time.delayedCall(760, () => {
      this.burst(960, 390, success ? 0x9fffe1 : 0xffb0b8);
      this.tweens.add({ targets: cap, angle: 12, duration: 120, yoyo: true, repeat: 3 });
      label.setText(success ? "CAPTURED!" : "IT BROKE FREE!").setColor(success ? "#a7ffe0" : "#ffc2c2");
    });
    this.time.delayedCall(1450, () => { [shade, cap, target, label].forEach((object) => object.destroy()); onDone(); });
  }

  private playAudio(key: WildsSoundKey) {
    (this.registry.get(REGISTRY_KEYS.wildsAudio) as WildsAudioManager | undefined)?.play(key);
  }
}
