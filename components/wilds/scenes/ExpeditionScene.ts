import Phaser from "phaser";
import { appendToCollection, grantCoins, registerBattleWin, registerRunComplete } from "../save";
import { REGISTRY_KEYS } from "../gameState";
import { wildsText } from "../Presentation";
import { ACTIVE_REGION, hexColor, type RegionCreature, type RegionQuestion, type RegionRarity, type WildsRegionManifest } from "../regions";
import type { WildsAudioManager, WildsSoundKey } from "../WildsAudio";

type ThingKind = "wild" | "gate" | string;
type WorldThing = {
  kind: ThingKind;
  creatureId?: string;
  sprite: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
  glow?: Phaser.GameObjects.Arc;
  used: boolean;
  magneting?: boolean;
};

const PLAYER_SIZE = 112;

export class ExpeditionScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
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
  private joystick = { active: false, x: 0, y: 0 };
  private interactTarget: WorldThing | null = null;
  private promptMessage = "";
  private promptClearAt = 0;
  private roomIndex = 0;
  private roomResolved = false;
  private transitioning = false;
  private battleOpen = false;
  private questionDeck: RegionQuestion[];
  private questionIndex = 0;
  private hp: number;
  private coins = 0;
  private captures = 0;
  private power = 0;
  private shield = 0;
  private lucky = 0;
  private hints = 0;
  private trailCooldown = 0;

  constructor(private readonly region: WildsRegionManifest = ACTIVE_REGION) {
    super({ key: "ExpeditionScene" });
    this.questionDeck = Phaser.Utils.Array.Shuffle([...region.questions]);
    this.hp = region.gameplay.startingHp;
  }

  create() {
    this.cameras.main.fadeIn(280, 4, 18, 28);
    this.physics.world.setBounds(0, 0, 1920, 1080);
    this.physics.world.gravity.y = 0;
    this.createBackground(this.region.rooms[0].background);
    this.createPlayer();
    this.createHud();
    this.createTargetMarker();
    this.createTouchControls();
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D,E") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-E", this.eHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off("keydown-E", this.eHandler));
    this.buildRoom(0);
  }

  update(_: number, delta: number) {
    this.updatePromptState();
    if (this.battleOpen || this.transitioning) return;

    let directionX = 0;
    let directionY = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) directionX -= 1;
    if (this.keys.right.isDown || this.wasd.D.isDown) directionX += 1;
    if (this.keys.up.isDown || this.wasd.W.isDown) directionY -= 1;
    if (this.keys.down.isDown || this.wasd.S.isDown) directionY += 1;
    if (this.joystick.active) {
      directionX += this.joystick.x;
      directionY += this.joystick.y;
    }
    const vector = new Phaser.Math.Vector2(directionX, directionY);
    if (vector.lengthSq() > 1) vector.normalize();

    if (vector.x !== 0 || vector.y !== 0) {
      this.player.setAcceleration(vector.x * 3000, vector.y * 2300);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, vector.x * 7, 0.2));
      this.trailCooldown -= delta;
      if (this.trailCooldown <= 0 && Math.abs(this.player.body!.velocity.x) > 120) {
        this.makeTrail();
        this.trailCooldown = 95;
      }
    } else {
      this.player.setAcceleration(0, 0);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, 0, 0.18));
    }

    this.player.y = Phaser.Math.Clamp(this.player.y, this.region.gameplay.playerMinY, this.region.gameplay.playerMaxY);
    if ((this.player.y <= this.region.gameplay.playerMinY && this.player.body!.velocity.y < 0) || (this.player.y >= this.region.gameplay.playerMaxY && this.player.body!.velocity.y > 0)) {
      this.player.setVelocityY(0);
    }

    const speed = Math.abs(this.player.body!.velocity.x);
    const stretch = Phaser.Math.Clamp(speed / 550, 0, 1);
    this.player.setDisplaySize(PLAYER_SIZE + stretch * 8, PLAYER_SIZE - stretch * 4);
    this.player.setDepth(10 + this.player.y / 1000);
    this.playerShadow.setPosition(this.player.x, this.player.y + 57).setDepth(9 + this.player.y / 1000).setScale(1 + stretch * 0.18, 1).setAlpha(0.22 + stretch * 0.1);

    this.updatePickups(delta);
    this.findInteractTarget();
    this.updateExitPortal();
    this.refreshHud();

    if (this.player.x >= this.region.gameplay.exitX - 70) {
      if (this.roomResolved) this.advanceRoom();
      else {
        this.player.x = this.region.gameplay.exitX - 74;
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

  private createPlayer() {
    this.playerShadow = this.add.ellipse(240, this.region.gameplay.floorY, 104, 24, 0x03121a, 0.28).setDepth(9);
    this.player = this.physics.add.image(240, this.region.gameplay.floorY - 58, "wilds-player-cap-round").setDisplaySize(PLAYER_SIZE, PLAYER_SIZE).setDepth(10);
    this.player.setCircle(104, 24, 24).setDrag(2350, 1900).setMaxVelocity(490, 300).setBounce(0.03).setCollideWorldBounds(true);
  }

  private createHud() {
    this.add.rectangle(360, 82, 640, 128, 0x06182a, 0.82).setDepth(30).setStrokeStyle(2, 0x8cf8dd, 0.4);
    this.add.rectangle(360, 128, 560, 12, 0x0a3042, 0.95).setDepth(31);
    this.progressFill = this.add.rectangle(80, 128, 0, 12, 0x79f5c9, 1).setOrigin(0, 0.5).setDepth(32);
    this.hud = wildsText(this, 80, 35, "", 23, "#f5fffb", { lineSpacing: 8 }).setDepth(32);
    this.roomLabel = wildsText(this, 960, 50, "", 29, "#f1fff8", { align: "center" }).setOrigin(0.5).setDepth(31);
    this.prompt = wildsText(this, 960, 958, "", 26, "#ffffff", { align: "center", wordWrap: { width: 1160 } }).setOrigin(0.5).setDepth(40);
  }

  private createTargetMarker() {
    const glow = this.add.circle(0, 0, 54, 0x65ffd4, 0.08).setStrokeStyle(3, 0xcaffed, 0.8);
    const arrow = this.add.triangle(0, -72, 0, 0, 25, 32, -25, 32, 0xcaffed, 0.95).setStrokeStyle(2, 0x06182a, 0.8);
    const label = wildsText(this, 0, 66, "BATTLE", 16, "#ffffff").setOrigin(0.5);
    this.targetMarker = this.add.container(0, 0, [glow, arrow, label]).setDepth(25).setVisible(false);
    this.tweens.add({ targets: this.targetMarker, y: "-=8", duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createTouchControls() {
    const isTouch = window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1100;
    const base = this.add.circle(140, 910, 72, 0x06182a, 0.68).setStrokeStyle(3, 0xa6f8e3, 0.58).setDepth(45).setInteractive().setVisible(isTouch);
    const knob = this.add.circle(140, 910, 28, 0x8ff7dd, 0.88).setDepth(46).setVisible(isTouch);
    this.touchBattleButton = this.add.rectangle(1740, 910, 210, 104, 0x16ac80, 0.92).setStrokeStyle(3, 0xdcfff4, 0.8).setDepth(45).setInteractive({ useHandCursor: true }).setVisible(isTouch);
    this.touchBattleLabel = wildsText(this, 1740, 910, "BATTLE", 24).setOrigin(0.5).setDepth(46).setVisible(isTouch);
    this.setBattleButtonActive(false);

    const updateStick = (pointer: Phaser.Input.Pointer) => {
      const delta = new Phaser.Math.Vector2(pointer.x - 140, pointer.y - 910);
      if (delta.length() > 54) delta.setLength(54);
      knob.setPosition(140 + delta.x, 910 + delta.y);
      this.joystick = { active: true, x: delta.x / 54, y: delta.y / 54 };
    };
    base.on("pointerdown", updateStick);
    base.on("pointermove", (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) updateStick(pointer); });
    this.input.on("pointerup", () => { this.joystick = { active: false, x: 0, y: 0 }; knob.setPosition(140, 910); });
    this.touchBattleButton.on("pointerup", () => this.tryInteract());
  }

  private buildRoom(index: number) {
    this.roomIndex = index;
    const room = this.region.rooms[index];
    this.roomResolved = !room.encounter;
    this.roomLabel.setText(`ROOM ${index + 1} / ${this.region.rooms.length}  •  ${room.name}`);
    this.spawnScenery(index);
    for (const pickup of room.pickups ?? []) {
      const pickupId = pickup.id ?? Phaser.Utils.Array.GetRandom(pickup.oneOf!);
      this.spawnPickup(pickup.x, pickupId);
    }
    if (room.encounter) {
      const creatureId = room.encounter.creatureId ?? this.pickCreature(room.encounter.rarityWeights ?? { common: 1 });
      this.spawnWild(room.encounter.x, creatureId);
      if (this.creatureById(creatureId).rarity === "boss") this.playAudio("boss-appear");
    }
    this.showPrompt(room.prompt, room.promptDuration ?? 2600, true);

    this.createExitPortal();
    this.refreshHud();
  }

  private spawnScenery(roomIndex: number) {
    const shuffled = Phaser.Utils.Array.Shuffle([...this.region.presentation.sceneryPool]);
    this.region.presentation.scenerySlots.forEach((slot, index) => {
      if ((roomIndex + index) % 4 === 0 && index === 2) return;
      const prop = this.add.image(slot.x, slot.y, shuffled[index]).setDisplaySize(slot.size, slot.size).setDepth(slot.y > 730 ? 8 : 3).setAlpha(0);
      this.roomVisuals.push(prop);
      this.tweens.add({ targets: prop, alpha: 0.94, duration: 320, delay: index * 55, ease: "Sine.easeOut" });
    });
  }

  private spawnWild(x: number, creatureId: string) {
    const creature = this.creatureById(creatureId);
    const y = this.roomIndex % 2 === 0 ? 725 : 775;
    const size = this.region.presentation.raritySizes[creature.rarity];
    const glowColor = hexColor(this.region.presentation.rarityGlows[creature.rarity]);
    const glow = this.add.circle(x, y, size * 0.49, glowColor, 0.13).setStrokeStyle(5, glowColor, 0.7).setDepth(9 + y / 1000).setAlpha(0);
    const sprite = this.add.image(x, y, creature.texture).setDisplaySize(size, size).setDepth(11 + y / 1000).setAlpha(0);
    const label = wildsText(this, x, y - size * 0.65, `${creature.rarity.toUpperCase()}  •  ${creature.name}`, 22, this.region.presentation.rarityColors[creature.rarity]).setOrigin(0.5).setDepth(14).setAlpha(0);
    this.roomVisuals.push(glow, sprite, label);
    this.things.push({ kind: creature.rarity === "boss" ? "gate" : "wild", creatureId: creature.id, sprite, label, glow, used: false });
    this.tweens.add({ targets: [glow, sprite, label], alpha: 1, duration: 360, ease: "Sine.easeOut" });
    this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.23, duration: 920, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: sprite, y: y - 8, duration: 980, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private spawnPickup(x: number, kind: ThingKind) {
    const pickup = this.pickupById(kind);
    const y = this.roomIndex % 2 === 0 ? 735 : 785;
    const color = hexColor(pickup.glow);
    const glow = this.add.circle(x, y, 74, color, 0.18).setStrokeStyle(5, color, 0.78).setDepth(10 + y / 1000).setAlpha(0);
    const sprite = this.add.image(x, y, pickup.texture).setDisplaySize(124, 138).setDepth(12 + y / 1000).setAlpha(0);
    this.roomVisuals.push(glow, sprite);
    this.things.push({ kind, sprite, glow, used: false });
    this.tweens.add({ targets: [glow, sprite], alpha: 1, duration: 260 });
    this.tweens.add({ targets: glow, scale: 1.12, alpha: 0.34, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: sprite, y: y - 12, duration: 820, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createExitPortal() {
    const glow = this.add.ellipse(0, 0, 110, 210, 0x5bf3cd, 0.08).setStrokeStyle(4, 0xb9ffed, 0.65);
    const arrowOne = this.add.triangle(-12, -24, 0, 0, 34, 28, 0, 56, 0xb9ffed, 0.82);
    const arrowTwo = this.add.triangle(20, -24, 0, 0, 34, 28, 0, 56, 0x53d9c5, 0.72);
    const text = wildsText(this, 0, 126, "NEXT", 18, "#dffff7").setOrigin(0.5);
    this.exitPortal = this.add.container(1790, this.region.gameplay.floorY - 105, [glow, arrowOne, arrowTwo, text]).setDepth(15).setAlpha(this.roomResolved ? 1 : 0.2);
    this.roomVisuals.push(this.exitPortal);
    this.tweens.add({ targets: glow, scaleX: 1.2, alpha: 0.2, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private updateExitPortal() {
    if (!this.exitPortal) return;
    const targetAlpha = this.roomResolved ? 1 : 0.18;
    this.exitPortal.setAlpha(Phaser.Math.Linear(this.exitPortal.alpha, targetAlpha, 0.08));
  }

  private advanceRoom() {
    if (this.transitioning || this.roomIndex >= this.region.rooms.length - 1) return;
    this.transitioning = true;
    this.player.setAcceleration(0, 0).setVelocity(0, 0);
    this.targetMarker.setVisible(false);
    const nextIndex = this.roomIndex + 1;
    const oldBackground = this.background;
    const nextBackground = this.add.image(2880, 540, this.region.rooms[nextIndex].background).setDisplaySize(2050, 1080).setDepth(-20);
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
      this.player.setPosition(220, this.region.gameplay.floorY - 58).setAlpha(1);
      this.playerShadow.setPosition(220, this.region.gameplay.floorY - 1).setAlpha(0.28);
      this.buildRoom(nextIndex);
    });
    this.time.delayedCall(680, () => {
      this.transitioning = false;
      this.showPrompt(`${this.region.rooms[nextIndex].name} discovered`, 1300, true);
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
      .map((thing) => ({ thing, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, thing.sprite.x, thing.sprite.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.interactTarget = nearest && nearest.distance < 190 ? nearest.thing : null;
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
        if (!thing.magneting) {
          this.tweens.killTweensOf(thing.sprite);
          if (thing.glow) this.tweens.killTweensOf(thing.glow);
        }
        thing.magneting = true;
        thing.sprite.x = Phaser.Math.Linear(thing.sprite.x, this.player.x, pull);
        thing.sprite.y = Phaser.Math.Linear(thing.sprite.y, this.player.y, pull);
        if (thing.glow) {
          thing.glow.x = thing.sprite.x;
          thing.glow.y = thing.sprite.y;
        }
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
    const pickup = this.pickupById(target.kind);
    target.used = true;
    this.tweens.killTweensOf(target.sprite);
    if (target.glow) this.tweens.killTweensOf(target.glow);
    this.burst(target.sprite.x, target.sprite.y, hexColor(pickup.glow));
    this.floatText(target.sprite.x, target.sprite.y - 54, pickup.effect.type === "coins" ? `+${pickup.effect.amount}` : pickup.id.toUpperCase(), pickup.glow);
    target.sprite.destroy();
    target.glow?.destroy();
    this.playAudio("item-use");
    const { type, amount } = pickup.effect;
    if (type === "coins") this.coins += amount;
    if (type === "heal") this.hp = Math.min(this.region.gameplay.startingHp, this.hp + amount);
    if (type === "shield") this.shield += amount;
    if (type === "power") this.power += amount;
    if (type === "captureBonus") this.lucky += amount;
    if (type === "hint") this.hints += amount;
    this.showPrompt(pickup.message, 1000, true);
  }

  private startBattle(target: WorldThing) {
    const creature = this.creatureById(target.creatureId!);
    this.battleOpen = true;
    this.player.setAcceleration(0, 0).setVelocity(0, 0);
    this.targetMarker.setVisible(false);
    let enemyHp: number = creature.hp;
    const maxEnemyHp = creature.hp;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(object: T) => { objects.push(object); return object; };
    const bg = add(this.add.image(960, 540, "region-battle-bg").setDisplaySize(1920, 1080).setDepth(60));
    add(this.add.rectangle(960, 540, 1920, 1080, 0x03111f, 0.5).setDepth(61));
    const playerPortrait = add(this.add.image(420, 350, "wilds-player-cap-round").setDisplaySize(230, 230).setDepth(63));
    const enemyPortrait = add(this.add.image(1500, 345, creature.texture).setDisplaySize(280, 280).setDepth(63));
    add(this.add.image(410, 120, "battle_hp_player_frame").setDisplaySize(620, 132).setDepth(63));
    add(this.add.image(1510, 120, "battle_hp_enemy_frame").setDisplaySize(620, 132).setDepth(63));
    const playerBar = add(this.add.rectangle(205, 138, 410 * (this.hp / this.region.gameplay.startingHp), 18, 0x4ee29b, 1).setOrigin(0, 0.5).setDepth(64));
    const enemyBar = add(this.add.rectangle(1305, 138, 410, 18, 0xff796f, 1).setOrigin(0, 0.5).setDepth(64));
    const playerHpText = add(wildsText(this, 410, 105, `YOUR CAP  •  ${this.hp}/${this.region.gameplay.startingHp}`, 23, "#eafff7").setOrigin(0.5).setDepth(65));
    const enemyHpText = add(wildsText(this, 1510, 105, `${creature.name.toUpperCase()}  •  ${enemyHp}/${maxEnemyHp}`, 23, this.region.presentation.rarityColors[creature.rarity]).setOrigin(0.5).setDepth(65));
    add(this.add.image(960, 500, "battle_question_panel").setDisplaySize(1120, 240).setDepth(63));
    const questionText = add(wildsText(this, 960, 470, "", 29, "#ffffff", { align: "center", wordWrap: { width: 900 } }).setOrigin(0.5).setDepth(65));
    const feedback = add(wildsText(this, 960, 550, "Tap an answer or use keys 1-4.", 24, "#d9fff5", { align: "center" }).setOrigin(0.5).setDepth(65));
    const buttons: Phaser.GameObjects.Container[] = [];
    const textures = ["battle_answer_button_green", "battle_answer_button_blue", "battle_answer_button_purple", "battle_answer_button_gold"];
    let keyHandler: ((event: KeyboardEvent) => void) | null = null;
    const clearKeys = () => { if (keyHandler) this.input.keyboard!.off("keydown", keyHandler); keyHandler = null; };
    const close = () => { clearKeys(); objects.forEach((object) => object.destroy()); this.battleOpen = false; };

    const showQuestion = () => {
      clearKeys();
      if (this.questionIndex >= this.questionDeck.length) {
        this.questionDeck = Phaser.Utils.Array.Shuffle([...this.region.questions]);
        this.questionIndex = 0;
      }
      const question = this.questionDeck[this.questionIndex++];
      const useHint = this.hints > 0;
      if (useHint) this.hints -= 1;
      questionText.setText(question.prompt);
      feedback.setColor("#d9fff5").setText(useHint ? "Hint active: two choices have faded." : "Tap an answer or use keys 1-4.");
      const wrong = [0, 1, 2, 3].filter((choice) => choice !== question.answer);
      buttons.forEach((button, index) => {
        button.removeAllListeners("pointerup");
        const label = button.getData("label") as Phaser.GameObjects.Text;
        const hidden = useHint && wrong.slice(0, 2).includes(index);
        label.setText(question.choices[index]);
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
            playerBar.width = 410 * (this.hp / this.region.gameplay.startingHp);
            playerHpText.setText(`YOUR CAP  •  ${this.hp}/${this.region.gameplay.startingHp}`);
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
      const y = index < 2 ? 750 : 925;
      const image = this.add.image(0, 0, textures[index]).setDisplaySize(540, 170);
      const label = wildsText(this, 0, 0, "", 29, "#ffffff", { align: "center", wordWrap: { width: 450 } }).setOrigin(0.5);
      const hitbox = this.add.rectangle(0, 0, 540, 170, 0xffffff, 0.001);
      const button = this.add.container(x, y, [image, label, hitbox]).setSize(540, 170).setDepth(65);
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

  private resolveCapture(target: WorldThing, creature: RegionCreature) {
    target.used = true;
    target.label?.destroy();
    target.sprite.destroy();
    target.glow?.destroy();
    const chance = Math.min(0.95, creature.captureRate + this.lucky);
    const success = Math.random() < chance;
    this.lucky = 0;
    this.coins += this.region.gameplay.coinRewards[creature.rarity];
    registerBattleWin();
    this.playCaptureMoment(creature, chance, success, () => {
      if (success) {
        appendToCollection(creature.id);
        this.captures += 1;
        this.playAudio("capture-success");
        this.showPrompt(`${creature.name} joined your ${this.region.name} collection!`, 2200, true);
      } else {
        this.playAudio("capture-fail");
        this.showPrompt(`${creature.name} escaped, but you earned Wild Coins.`, 2200, true);
      }
      this.roomResolved = true;
      if (this.roomIndex === this.region.rooms.length - 1) this.time.delayedCall(900, () => this.finishRun(true));
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
    const heading = wildsText(this, 960, 440, victory ? this.region.copy.victoryHeading : "EXPEDITION OVER", 40, victory ? "#b7ffe7" : "#ffd1d1").setOrigin(0.5).setDepth(94);
    const stats = wildsText(this, 960, 580, `Rooms explored: ${this.roomIndex + 1}/${this.region.rooms.length}\nWilds captured: ${this.captures}\nCoins earned: ${this.coins}\n${victory ? this.region.copy.victorySummary : "Your captures and coins are safely kept."}`, 26, "#ffffff", { align: "center", lineSpacing: 10, wordWrap: { width: 760 } }).setOrigin(0.5).setDepth(94);
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
    this.hud.setText(`${this.region.shortName}  •  HP ${this.hp}/${this.region.gameplay.startingHp}\nCoins ${this.coins}   Catches ${this.captures}   Shield ${this.shield}   Power ${this.power}`);
    this.progressFill.width = ((this.roomIndex + (this.roomResolved ? 1 : 0.45)) / this.region.rooms.length) * 560;
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

  private pickCreature(weights: Partial<Record<RegionRarity, number>>) {
    const entries = (Object.entries(weights) as Array<[RegionRarity, number]>).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    let rarity = entries[0]?.[0] ?? "common";
    for (const [candidate, weight] of entries) {
      roll -= weight;
      if (roll <= 0) { rarity = candidate; break; }
    }
    const pool = this.region.creatures.filter((creature) => creature.rarity === rarity);
    return Phaser.Utils.Array.GetRandom(pool.length > 0 ? pool : this.region.creatures).id;
  }

  private creatureById(id: string) {
    const creature = this.region.creatures.find((entry) => entry.id === id);
    if (!creature) throw new Error(`Unknown creature ${id} in region ${this.region.id}`);
    return creature;
  }

  private pickupById(id: string) {
    const pickup = this.region.pickups.find((entry) => entry.id === id);
    if (!pickup) throw new Error(`Unknown pickup ${id} in region ${this.region.id}`);
    return pickup;
  }

  private makeTrail() {
    const trail = this.add.circle(this.player.x - Math.sign(this.player.body!.velocity.x) * 38, this.player.y + 34, Phaser.Math.Between(4, 8), 0xb4fff0, 0.55).setDepth(8);
    this.tweens.add({ targets: trail, y: trail.y - 20, alpha: 0, scale: 2, duration: 420, onComplete: () => trail.destroy() });
  }

  private floatText(x: number, y: number, message: string, color = "#ffffff") {
    const text = wildsText(this, x, y, message, 26, color).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: text, y: y - 48, alpha: 0, scale: 1.15, duration: 700, ease: "Cubic.easeOut", onComplete: () => text.destroy() });
  }

  private burst(x: number, y: number, color: number) {
    for (let index = 0; index < 12; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 8), color, 0.92).setDepth(80);
      this.tweens.add({ targets: dot, x: x + Phaser.Math.Between(-105, 105), y: y + Phaser.Math.Between(-85, 70), alpha: 0, scale: 0.2, duration: Phaser.Math.Between(360, 620), onComplete: () => dot.destroy() });
    }
  }

  private playCaptureMoment(creature: RegionCreature, chance: number, success: boolean, onDone: () => void) {
    const shade = this.add.rectangle(960, 540, 1920, 1080, 0x031624, 0.72).setDepth(70);
    const cap = this.add.image(960, 700, "wilds-player-cap-round").setDisplaySize(150, 150).setDepth(72);
    const target = this.add.image(960, 300, creature.texture).setDisplaySize(250, 250).setDepth(72);
    const label = wildsText(this, 960, 850, `CAPTURE CHANCE ${Math.round(chance * 100)}%`, 29, this.region.presentation.rarityColors[creature.rarity]).setOrigin(0.5).setDepth(73);
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
