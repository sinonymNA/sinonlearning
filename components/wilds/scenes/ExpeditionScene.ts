import Phaser from "phaser";
import { appendToCollection, grantCoins, registerBattleWin, registerRunComplete } from "../save";
import { wildsText } from "../Presentation";

type ThingKind = "wild" | "coin" | "heal" | "shield" | "power" | "lucky" | "hint" | "gate";
type WorldThing = { kind: ThingKind; creatureId?: string; sprite: Phaser.GameObjects.Image; label?: Phaser.GameObjects.Text; used: boolean; magneting?: boolean };

const EASY_QUESTIONS = [
  { prompt: "What is 2 + 3?", choices: ["4", "5", "6", "7"], answer: 1 },
  { prompt: "Which color is the sky on a clear day?", choices: ["Blue", "Green", "Pink", "Orange"], answer: 0 },
  { prompt: "How many legs does a dog have?", choices: ["2", "3", "4", "5"], answer: 2 },
  { prompt: "What shape has three sides?", choices: ["Circle", "Triangle", "Square", "Star"], answer: 1 },
  { prompt: "Which animal says meow?", choices: ["Dog", "Bird", "Cat", "Fish"], answer: 2 },
  { prompt: "What is 10 - 4?", choices: ["5", "6", "7", "8"], answer: 1 },
  { prompt: "Which season comes after spring?", choices: ["Winter", "Summer", "Fall", "Night"], answer: 1 },
  { prompt: "How many days are in a week?", choices: ["5", "6", "7", "8"], answer: 2 },
  { prompt: "What do plants need from the sun?", choices: ["Moonlight", "Energy", "Snow", "Sound"], answer: 1 },
  { prompt: "Which is a fruit?", choices: ["Carrot", "Apple", "Potato", "Bread"], answer: 1 },
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

const rarityColor: Record<string, string> = { common: "#d9fff0", rare: "#8ce6ff", epic: "#e1b6ff", boss: "#ffcf79" };
const WORLD_WIDTH = 12800;
const FLOOR_Y = 792;
const PLAYER_RADIUS = 55;
const STRIP_SPACING = 980;
const EVENT_LANES = [674, 734, 792];
const PROP_LANES = [622, 706, 834];

export class ExpeditionScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private things: WorldThing[] = [];
  private distance = 0;
  private nextStrip = 1100;
  private hp = 5;
  private coins = 0;
  private captures = 0;
  private interactTarget: WorldThing | null = null;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private hud!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private promptMessage = "";
  private promptClearAt = 0;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private touchBattleButton!: Phaser.GameObjects.Rectangle;
  private touchBattleLabel!: Phaser.GameObjects.Text;
  private joystick = { active: false, x: 0, y: 0 };
  private battleOpen = false;
  private questionIndex = 0;
  private power = 0;
  private shield = 0;
  private lucky = 0;
  private hints = 0;
  private targetMarker!: Phaser.GameObjects.Container;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private gateArmed = false;

  constructor() { super({ key: "ExpeditionScene" }); }

  create() {
    this.cameras.main.fadeIn(180, 8, 18, 31);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.physics.world.gravity.y = 1800;
    this.addFieldSections();
    this.createGround();
    this.playerShadow = this.add.ellipse(300, FLOOR_Y + 6, 108, 26, 0x03121a, 0.34).setDepth(6);
    this.player = this.physics.add.image(300, FLOOR_Y - PLAYER_RADIUS, "wilds-player-cap-round").setDisplaySize(110, 110).setDepth(8);
    this.player.setCircle(110).setOffset(73, 73).setBounce(0.08).setDragX(2200).setMaxVelocity(560, 1600).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.ground);
    this.cameras.main.startFollow(this.player, true, 0.11, 0.08).setFollowOffset(-340, 0);
    this.cameras.main.setDeadzone(420, 180);
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D,E") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-E", () => this.tryInteract());
    this.createHud();
    this.createTargetMarker();
    this.createTouchControls();
    this.spawnStrip(900);
    this.spawnStrip(1880);
    this.spawnStrip(2860);
    this.showPrompt("Verdant Rift: roll across the field, collect rewards, and catch Wilds.");
  }

  update(_: number, delta: number) {
    if (this.battleOpen) return;
    let dx = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.keys.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.joystick.active) dx += this.joystick.x;
    dx = Phaser.Math.Clamp(dx, -1, 1);
    if (dx) {
      this.player.setAccelerationX(dx * 3200);
      this.player.setAngularVelocity(0);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, dx * 8, 0.24));
      this.distance = Math.max(this.distance, Math.floor(this.player.x - 300));
      if (Math.random() < 0.12) this.makeTrail();
    } else {
      this.player.setAccelerationX(0);
      this.player.setAngularVelocity(0);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, 0, 0.18));
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 80, 12400);
    while (this.player.x + 1500 > this.nextStrip && this.nextStrip < 10600) {
      this.spawnStrip(this.nextStrip);
      this.nextStrip += STRIP_SPACING;
    }
    if (this.nextStrip >= 10600 && !this.things.some((thing) => thing.kind === "gate")) this.spawnGate();
    this.updatePlayerPresentation();
    this.updatePickups(delta);
    this.sortThingDepths();
    this.cleanupPassedThings();
    this.findInteractTarget();
    this.checkGateWalkIn();
    this.refreshHud();
    this.updatePromptState();
  }

  private addFieldSections() {
    this.add.image(960, 540, "expedition-meadow").setDisplaySize(1920, 1080).setScrollFactor(0).setDepth(-10);
    this.add.rectangle(960, 540, 1920, 1080, 0x052035, 0.06).setScrollFactor(0).setDepth(-9);
    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y + 78, WORLD_WIDTH, 170, 0x061a1d, 0.1).setDepth(-4);
  }

  private createGround() {
    this.ground = this.physics.add.staticGroup();
    const floor = this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y + PLAYER_RADIUS, WORLD_WIDTH, 28, 0x000000, 0);
    this.physics.add.existing(floor, true);
    this.ground.add(floor);
  }

  private updatePlayerPresentation() {
    const speed = Math.abs(this.player.body?.velocity.x ?? 0);
    const squash = Phaser.Math.Clamp(speed / 900, 0, 0.1);
    this.player.setDisplaySize(110 + squash * 90, 110 - squash * 40);
    this.player.setDepth(8 + this.player.y / 1000);
    this.playerShadow
      .setPosition(this.player.x, FLOOR_Y + 9)
      .setScale(1 + squash * 1.5, 1)
      .setAlpha(0.24 + squash * 0.34);
  }

  private sortThingDepths() {
    for (const thing of this.things) {
      if (thing.used) continue;
      const baseDepth = thing.kind === "gate" ? 9 : thing.kind === "wild" ? 8 : 7;
      thing.sprite.setDepth(baseDepth + thing.sprite.y / 1000);
      thing.label?.setDepth(baseDepth + 1.5);
    }
  }

  private spawnStrip(x: number) {
    const propKeys = ["prop_grass", "prop_flowers", "prop_mushrooms", "prop_crystal", "prop_rock", "prop_pillar", "prop_ruin", "prop_bush", "prop_log", "prop_rune"];
    const propSlots = [
      { x: x + 90, y: Phaser.Utils.Array.GetRandom(PROP_LANES) },
      { x: x + 500, y: Phaser.Utils.Array.GetRandom(PROP_LANES) },
      { x: x + 850, y: Phaser.Utils.Array.GetRandom(PROP_LANES) },
    ];
    propSlots.forEach((slot, index) => {
      const prop = this.add.image(slot.x + Phaser.Math.Between(-24, 24), slot.y + Phaser.Math.Between(-12, 14), Phaser.Utils.Array.GetRandom(propKeys));
      const size = index === 1 ? Phaser.Math.Between(95, 135) : Phaser.Math.Between(118, 170);
      prop.setDisplaySize(size, size).setDepth(slot.y < FLOOR_Y ? 2 : 9).setAlpha(0.92);
    });
    const roll = Math.random();
    const count = roll < 0.18 ? 2 : 1;
    const lanes = Phaser.Utils.Array.Shuffle([...EVENT_LANES]);
    for (let index = 0; index < count; index += 1) {
      const eventX = x + 270 + index * 430 + Phaser.Math.Between(-24, 24);
      const eventY = lanes[index] ?? FLOOR_Y;
      if (Math.random() < 0.58) this.spawnWild(eventX, eventY);
      else this.spawnPickup(eventX, eventY);
    }
  }

  private spawnWild(x: number, y: number) {
    const progress = Phaser.Math.Clamp(this.distance / 10000, 0, 1);
    const pool = CREATURES.filter((creature) => {
      if (creature.id === "warden_wisp") return false;
      if (creature.rarity === "common") return true;
      if (creature.rarity === "rare") return Math.random() < 0.16 + progress * 0.36;
      return Math.random() < 0.025 + progress * 0.18;
    });
    const creature = Phaser.Utils.Array.GetRandom(pool);
    const sprite = this.add.image(x, y, `field_${creature.id}`).setDisplaySize(142, 142).setDepth(6 + y / 1000).setAlpha(0);
    const label = wildsText(this, x, y - 92, creature.rarity.toUpperCase(), 13, rarityColor[creature.rarity]).setOrigin(0.5).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: [sprite, label], alpha: 1, duration: 260, ease: "Sine.easeOut" });
    this.tweens.add({ targets: sprite, y: y - 7, duration: 1050, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: label, y: y - 99, duration: 1050, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.things.push({ kind: "wild", creatureId: creature.id, sprite, label, used: false });
  }

  private spawnPickup(x: number, y: number) {
    const kind = Phaser.Utils.Array.GetRandom(["coin", "coin", "heal", "shield", "power", "lucky", "hint"] as ThingKind[]);
    const sprite = this.add.image(x, y, `pickup_${kind}`).setDisplaySize(84, 96).setDepth(7).setAlpha(0);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 220, ease: "Sine.easeOut" });
    this.tweens.add({ targets: sprite, y: y - 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.things.push({ kind, sprite, used: false });
  }

  private spawnGate() {
    const glow = this.add.circle(11200, FLOOR_Y - 52, 132, 0x42f4ff, 0.16).setDepth(4);
    const sprite = this.add.image(11200, FLOOR_Y - 82, "field_warden_wisp").setDisplaySize(220, 220).setDepth(7);
    this.add.image(11200, FLOOR_Y - 10, "prop_ruin").setDisplaySize(310, 310).setDepth(5);
    const label = wildsText(this, 11200, FLOOR_Y - 235, "RIFT GATE", 18, "#ffdf91").setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: glow, scale: 1.24, alpha: 0.32, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: sprite, y: FLOOR_Y - 94, duration: 1150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.things.push({ kind: "gate", creatureId: "warden_wisp", sprite, label, used: false });
    this.showPrompt("The Rift Gate has opened ahead. Prepare for Warden Wisp.", 2600, true);
  }

  private createHud() {
    this.add.rectangle(440, 78, 760, 116, 0x06172a, 0.78).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x83f3de, 0.5);
    this.add.rectangle(440, 128, 690, 12, 0x0b2a3f, 0.92).setScrollFactor(0).setDepth(21);
    this.progressFill = this.add.rectangle(95, 128, 0, 12, 0x7af6cf, 0.9).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22);
    this.hud = wildsText(this, 92, 47, "", 21, "#f7fffb", { lineSpacing: 8 }).setScrollFactor(0).setDepth(21);
    this.prompt = wildsText(this, 960, 950, "", 20, "#ffffff", { align: "center", wordWrap: { width: 980 } }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
  }

  private createTargetMarker() {
    const ring = this.add.circle(0, 0, 42, 0x8effde, 0.1).setStrokeStyle(3, 0xc9fff0, 0.72);
    const arrow = this.add.triangle(0, -48, 0, 0, 26, 34, -26, 34, 0xc9fff0, 0.88).setStrokeStyle(2, 0x0b2035, 0.7);
    const label = wildsText(this, 0, 56, "BATTLE", 12, "#ffffff").setOrigin(0.5);
    this.targetMarker = this.add.container(0, 0, [ring, arrow, label]).setDepth(18).setVisible(false);
    this.tweens.add({ targets: this.targetMarker, y: "-=10", duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createTouchControls() {
    const base = this.add.circle(150, 905, 78, 0x071a32, 0.62).setStrokeStyle(3, 0x9addec, 0.6).setScrollFactor(0).setDepth(30).setInteractive();
    const knob = this.add.circle(150, 905, 30, 0x8ff7dd, 0.8).setScrollFactor(0).setDepth(31);
    const interact = this.add.rectangle(1750, 900, 210, 112, 0x1bb687, 0.9).setStrokeStyle(3, 0xd8fff1, 0.75).setScrollFactor(0).setDepth(30).setInteractive({ useHandCursor: true });
    const interactLabel = wildsText(this, 1750, 900, "BATTLE\n[E]", 19, "#ffffff", { align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.touchBattleButton = interact;
    this.touchBattleLabel = interactLabel;
    this.setBattleButtonActive(false);
    base.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.updateJoystick(pointer, knob));
    base.on("pointermove", (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) this.updateJoystick(pointer, knob); });
    base.on("pointerup", () => { this.joystick.active = false; knob.setPosition(150, 905); });
    this.input.on("pointerup", () => { if (this.joystick.active) { this.joystick.active = false; knob.setPosition(150, 905); } });
    interact.on("pointerup", () => this.tryInteract());
  }

  private updateJoystick(pointer: Phaser.Input.Pointer, knob: Phaser.GameObjects.Arc) {
    const dx = pointer.x - 150;
    const dy = pointer.y - 905;
    const length = Math.max(1, Math.hypot(dx, dy));
    const clamp = Math.min(58, length);
    this.joystick = { active: true, x: dx / length, y: dy / length };
    knob.setPosition(150 + dx / length * clamp, 905 + dy / length * clamp);
  }

  private findInteractTarget() {
    const nearest = this.things
      .filter((thing) => !thing.used && (thing.kind === "wild" || thing.kind === "gate"))
      .map((thing) => ({ thing, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, thing.sprite.x, thing.sprite.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.interactTarget = nearest && nearest.distance < 124 ? nearest.thing : null;
    if (!this.interactTarget) {
      this.targetMarker.setVisible(false);
      this.setBattleButtonActive(false);
      return;
    }
    this.setBattleButtonActive(true);
    this.targetMarker.setVisible(true).setPosition(this.interactTarget.sprite.x, this.interactTarget.sprite.y - 132);
    if (this.interactTarget.kind === "gate") {
      this.showPrompt("Rift Gate reached. Press E or BATTLE to challenge Warden Wisp.", 900);
    } else {
      this.showPrompt("Wild spotted. Press E or BATTLE to begin a quiz battle.", 900);
    }
  }

  private updatePickups(delta: number) {
    const pull = Phaser.Math.Clamp(delta / 1000 * 8, 0, 0.32);
    for (const thing of this.things) {
      if (thing.used || thing.kind === "wild" || thing.kind === "gate") continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, thing.sprite.x, thing.sprite.y);
      if (distance < 230) {
        if (!thing.magneting) this.tweens.killTweensOf(thing.sprite);
        thing.magneting = true;
        thing.sprite.x = Phaser.Math.Linear(thing.sprite.x, this.player.x, pull);
        thing.sprite.y = Phaser.Math.Linear(thing.sprite.y, this.player.y - 16, pull);
        thing.sprite.setScale(Phaser.Math.Linear(thing.sprite.scaleX, 0.86, 0.12));
      }
      if (distance < 70) this.collectPickup(thing);
    }
  }

  private cleanupPassedThings() {
    const cutoff = this.player.x - 1500;
    this.things = this.things.filter((thing) => {
      if (thing.used) return false;
      if (thing.kind === "gate" || thing.sprite.x > cutoff) return true;
      thing.label?.destroy();
      thing.sprite.destroy();
      return false;
    });
  }

  private checkGateWalkIn() {
    if (this.gateArmed || this.battleOpen) return;
    const gate = this.things.find((thing) => thing.kind === "gate" && !thing.used);
    if (!gate) return;
    const closeEnough = Phaser.Math.Distance.Between(this.player.x, this.player.y, gate.sprite.x, gate.sprite.y) < 92;
    if (!closeEnough) return;
    this.gateArmed = true;
    this.interactTarget = gate;
    this.showPrompt("The Rift pulls you in...", 1200, true);
    this.time.delayedCall(260, () => {
      if (!this.battleOpen && !gate.used) this.startBattle(gate);
    });
  }

  private setBattleButtonActive(active: boolean) {
    if (!this.touchBattleButton || !this.touchBattleLabel) return;
    this.touchBattleButton.setAlpha(active ? 0.92 : 0.34);
    this.touchBattleLabel.setAlpha(active ? 1 : 0.52);
  }

  private tryInteract() {
    if (!this.interactTarget || this.battleOpen) return;
    const target = this.interactTarget;
    if (target.kind === "wild" || target.kind === "gate") this.startBattle(target);
    else this.collectPickup(target);
  }

  private collectPickup(target: WorldThing) {
    if (target.used) return;
    target.used = true;
    target.label?.destroy();
    this.targetMarker.setVisible(false);
    this.burst(target.sprite.x, target.sprite.y, target.kind === "heal" ? 0xff91a4 : 0x8fffe4);
    const rewardText = target.kind === "coin" ? "+8" : target.kind.toUpperCase();
    this.floatText(target.sprite.x, target.sprite.y - 64, rewardText, target.kind === "coin" ? "#ffdf74" : "#bfffee");
    target.sprite.destroy();
    if (target.kind === "coin") { this.coins += 8; this.showPrompt("+8 Wild Coins", 1200, true); }
    if (target.kind === "heal") { this.hp = Math.min(5, this.hp + 1); this.showPrompt("Healing Capsule: +1 HP", 1200, true); }
    if (target.kind === "shield") { this.shield += 1; this.showPrompt("Shield Capsule ready", 1200, true); }
    if (target.kind === "power") { this.power += 1; this.showPrompt("Power Capsule ready", 1200, true); }
    if (target.kind === "lucky") { this.lucky += 0.2; this.showPrompt("Lucky Capsule: better capture odds", 1200, true); }
    if (target.kind === "hint") { this.hints += 1; this.showPrompt("Hint Scroll ready", 1200, true); }
  }

  private startBattle(target: WorldThing) {
    const creature = CREATURES.find((entry) => entry.id === target.creatureId)!;
    this.battleOpen = true;
    this.targetMarker.setVisible(false);
    let enemyHp = creature.hp;
    const bg = this.add.image(960, 540, "verdant-battle-bg").setDisplaySize(1920, 1080).setScrollFactor(0).setDepth(50);
    const overlay = this.add.rectangle(960, 540, 1920, 1080, 0x041224, 0.62).setScrollFactor(0).setDepth(51);
    const portrait = this.add.image(960, 245, `field_${creature.id}`).setDisplaySize(260, 260).setScrollFactor(0).setDepth(52);
    const title = wildsText(this, 960, 92, `${creature.name.toUpperCase()}  ${enemyHp}/${creature.hp}`, 32, rarityColor[creature.rarity]).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const questionText = wildsText(this, 960, 430, "", 27, "#ffffff", { align: "center", wordWrap: { width: 1040 } }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const feedback = wildsText(this, 960, 545, "", 22, "#d8fff0", { align: "center", wordWrap: { width: 980 } }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const buttons: Phaser.GameObjects.Container[] = [];
    let keyHandler: ((event: KeyboardEvent) => void) | null = null;
    const clearKeyHandler = () => {
      if (!keyHandler) return;
      this.input.keyboard!.off("keydown", keyHandler);
      keyHandler = null;
    };
    const close = () => { clearKeyHandler(); [bg, overlay, portrait, title, questionText, feedback, ...buttons].forEach((object) => object.destroy()); this.battleOpen = false; };
    const showQuestion = () => {
      clearKeyHandler();
      const question = EASY_QUESTIONS[this.questionIndex++ % EASY_QUESTIONS.length];
      const useHint = this.hints > 0;
      if (useHint) this.hints -= 1;
      questionText.setText(question.prompt);
      feedback.setText(useHint ? "Hint active: two wrong answers have faded." : "Choose the right answer to damage the Wild.");
      buttons.forEach((button, index) => {
        const label = button.getData("label") as Phaser.GameObjects.Text;
        label.setText(`${index + 1}. ${question.choices[index]}`);
        const wrongChoices = [0, 1, 2, 3].filter((choice) => choice !== question.answer);
        const hiddenByHint = useHint && wrongChoices.slice(0, 2).includes(index);
        button.setVisible(true).setActive(true).setAlpha(hiddenByHint ? 0.22 : 1);
        button.setInteractive({ useHandCursor: true });
        button.once("pointerup", () => {
          clearKeyHandler();
          buttons.forEach((item) => item.disableInteractive());
          const correct = index === question.answer;
          if (correct) {
            const damage = this.power > 0 ? 2 : 1;
            this.power = Math.max(0, this.power - 1);
            enemyHp -= damage;
            title.setText(`${creature.name.toUpperCase()}  ${Math.max(0, enemyHp)}/${creature.hp}`);
            feedback.setColor("#9dffcf").setText(`Correct! ${creature.name} takes ${damage} hit${damage > 1 ? "s" : ""}.`);
            this.burst(960, 245, 0xffde78);
            this.tweens.add({ targets: portrait, scale: 1.1, duration: 110, yoyo: true, repeat: 1 });
          } else if (this.shield > 0) {
            this.shield -= 1;
            feedback.setColor("#8ce6ff").setText("Not quite, but your shield blocks the hit.");
            this.burst(960, 245, 0x77e8ff);
          } else {
            this.hp -= 1;
            feedback.setColor("#ffb5b5").setText("Not quite. You lose 1 heart. The Wild takes no damage.");
            this.cameras.main.shake(130, 0.004);
          }
          if (enemyHp <= 0) {
            this.time.delayedCall(900, () => { close(); this.resolveCapture(target, creature); });
          } else if (this.hp <= 0) {
            this.time.delayedCall(1000, () => { close(); this.finishRun(false); });
          } else {
            this.time.delayedCall(900, showQuestion);
          }
        });
      });
      keyHandler = (event: KeyboardEvent) => {
        const answerIndex = ["1", "2", "3", "4"].indexOf(event.key);
        if (answerIndex >= 0 && buttons[answerIndex]?.active) buttons[answerIndex].emit("pointerup");
      };
      this.input.keyboard!.on("keydown", keyHandler);
    };
    [0, 1, 2, 3].forEach((index) => {
      const x = index % 2 === 0 ? 610 : 1310;
      const y = index < 2 ? 690 : 830;
      const bg = this.add.rectangle(0, 0, 570, 112, index % 2 ? 0x278de4 : 0x18ae7d, 0.96).setStrokeStyle(3, 0xe9fffd, 0.72);
      const label = wildsText(this, 0, 0, "", 22, "#ffffff", { align: "center", wordWrap: { width: 470 } }).setOrigin(0.5);
      const hitbox = this.add.rectangle(0, 0, 570, 112, 0xffffff, 0.001);
      const button = this.add.container(x, y, [bg, label, hitbox]).setSize(570, 112).setScrollFactor(0).setDepth(52);
      button.setData("label", label);
      buttons.push(button);
    });
    showQuestion();
  }

  private resolveCapture(target: WorldThing, creature: typeof CREATURES[number]) {
    target.used = true;
    target.label?.destroy();
    target.sprite.destroy();
    const chance = Math.min(0.95, creature.rate + this.lucky);
    this.lucky = 0;
    this.coins += creature.rarity === "boss" ? 45 : creature.rarity === "epic" ? 25 : creature.rarity === "rare" ? 16 : 10;
    registerBattleWin();
    this.playCaptureMoment(creature, chance, () => {
      if (Math.random() < chance) {
        appendToCollection(creature.id);
        this.captures += 1;
        this.showPrompt(`${creature.name} joined your Verdant Rift collection!`, 2200, true);
      } else {
        this.showPrompt(`${creature.name} escaped, but you earned Wild Coins.`, 2200, true);
      }
      if (creature.id === "warden_wisp") this.finishRun(true);
    });
  }

  private finishRun(victory: boolean) {
    grantCoins(this.coins);
    if (victory) registerRunComplete();
    this.battleOpen = true;
    const layer = this.add.rectangle(960, 540, 1920, 1080, 0x03101a, 0.88).setScrollFactor(0).setDepth(80);
    const heading = wildsText(this, 960, 300, victory ? "VERDANT RIFT CLEARED!" : "EXPEDITION OVER", 44, victory ? "#a7ffe0" : "#ffd1d1").setOrigin(0.5).setScrollFactor(0).setDepth(81);
    const stats = wildsText(this, 960, 445, `Distance: ${this.distance}m\nWilds captured: ${this.captures}\nCoins earned: ${this.coins}\n${victory ? "The next region will bring tougher questions and rarer Wilds." : "Your captures and coins are safely kept."}`, 25, "#ffffff", { align: "center", lineSpacing: 12 }).setOrigin(0.5).setScrollFactor(0).setDepth(81);
    const button = this.add.rectangle(760, 700, 360, 116, 0x1ab982, 0.98).setStrokeStyle(3, 0xe3fff5, 0.85).setScrollFactor(0).setDepth(81).setInteractive({ useHandCursor: true });
    const label = wildsText(this, 760, 700, "PLAY AGAIN", 26).setOrigin(0.5).setScrollFactor(0).setDepth(82);
    const titleButton = this.add.rectangle(1160, 700, 360, 116, 0x277fc5, 0.98).setStrokeStyle(3, 0xd9f4ff, 0.85).setScrollFactor(0).setDepth(81).setInteractive({ useHandCursor: true });
    const titleLabel = wildsText(this, 1160, 700, "TITLE", 26).setOrigin(0.5).setScrollFactor(0).setDepth(82);
    button.on("pointerup", () => this.scene.restart());
    titleButton.on("pointerup", () => this.scene.start("TitleScene"));
    [layer, heading, stats, button, label, titleButton, titleLabel];
  }

  private refreshHud() {
    this.hud.setText(`VERDANT RIFT   ${this.distance}m / 10,000m\nHP ${this.hp}/5   Coins ${this.coins}   Catches ${this.captures}   Shield ${this.shield}   Power ${this.power}`);
    this.progressFill.width = Phaser.Math.Clamp(this.distance / 10000, 0, 1) * 690;
  }

  private showPrompt(message: string, duration = 1800, force = false) {
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

  private makeTrail() {
    const trail = this.add.circle(this.player.x - 34, this.player.y + 40, Phaser.Math.Between(4, 8), 0xa2fff0, 0.62).setDepth(7);
    this.tweens.add({ targets: trail, alpha: 0, scale: 2.2, duration: 450, onComplete: () => trail.destroy() });
  }

  private floatText(x: number, y: number, message: string, color = "#ffffff") {
    const text = wildsText(this, x, y, message, 20, color).setOrigin(0.5).setDepth(42);
    this.tweens.add({
      targets: text,
      y: y - 46,
      alpha: 0,
      scale: 1.16,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private burst(x: number, y: number, color: number) {
    for (let index = 0; index < 10; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 9), color, 0.95).setDepth(70);
      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-80, 80),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(340, 620),
        onComplete: () => dot.destroy(),
      });
    }
  }

  private playCaptureMoment(creature: typeof CREATURES[number], chance: number, onDone: () => void) {
    const shade = this.add.rectangle(960, 540, 1920, 1080, 0x031624, 0.48).setScrollFactor(0).setDepth(60);
    const cap = this.add.image(960, 660, "wilds-player-cap-round").setDisplaySize(145, 145).setScrollFactor(0).setDepth(62);
    const target = this.add.image(960, 290, `field_${creature.id}`).setDisplaySize(240, 240).setScrollFactor(0).setDepth(62);
    const label = wildsText(this, 960, 820, `CAPTURE CHANCE ${Math.round(chance * 100)}%`, 24, rarityColor[creature.rarity]).setOrigin(0.5).setScrollFactor(0).setDepth(63);
    this.tweens.add({ targets: cap, y: 360, scale: 0.55, duration: 500, ease: "Quad.easeIn" });
    this.tweens.add({ targets: target, scale: 0.12, alpha: 0, duration: 600, delay: 230, ease: "Quad.easeIn" });
    this.time.delayedCall(740, () => {
      this.burst(960, 360, creature.rarity === "boss" ? 0xffd577 : 0x9fffe1);
      this.tweens.add({ targets: cap, angle: 12, duration: 120, yoyo: true, repeat: 2 });
    });
    this.time.delayedCall(1320, () => {
      [shade, cap, target, label].forEach((object) => object.destroy());
      onDone();
    });
  }
}
