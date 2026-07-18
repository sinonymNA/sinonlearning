import Phaser from "phaser";
import { appendToCollection, grantCoins, registerBattleWin, registerRunComplete } from "../save";
import { wildsText } from "../Presentation";

type ThingKind = "wild" | "coin" | "heal" | "shield" | "power" | "lucky" | "hint" | "gate";
type WorldThing = { kind: ThingKind; creatureId?: string; sprite: Phaser.GameObjects.Image; label?: Phaser.GameObjects.Text; used: boolean };

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

export class ExpeditionScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private things: WorldThing[] = [];
  private distance = 0;
  private nextStrip = 1100;
  private hp = 5;
  private coins = 0;
  private captures = 0;
  private interactTarget: WorldThing | null = null;
  private hud!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private joystick = { active: false, x: 0, y: 0 };
  private battleOpen = false;
  private questionIndex = 0;
  private power = 0;
  private shield = 0;
  private lucky = 0;
  private hints = 0;
  private targetMarker!: Phaser.GameObjects.Container;

  constructor() { super({ key: "ExpeditionScene" }); }

  create() {
    this.cameras.main.setBounds(0, 0, 12800, 1080);
    this.physics.world.setBounds(0, 0, 12800, 1080);
    this.addFieldSections();
    this.player = this.add.image(300, 720, "wilds-player-cap").setDisplaySize(116, 116).setDepth(8);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08).setFollowOffset(-260, 0);
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D,E") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-E", () => this.tryInteract());
    this.createHud();
    this.createTargetMarker();
    this.createTouchControls();
    this.spawnStrip(900);
    this.spawnStrip(1900);
    this.spawnStrip(2900);
    this.showPrompt("Verdant Rift: explore, collect, and catch Wilds. Move with WASD or the touch joystick.");
  }

  update(_: number, delta: number) {
    if (this.battleOpen) return;
    const speed = 0.42 * delta;
    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.keys.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.keys.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.keys.down.isDown || this.wasd.S.isDown) dy += 1;
    if (this.joystick.active) { dx += this.joystick.x; dy += this.joystick.y; }
    const vector = new Phaser.Math.Vector2(dx, dy).normalize();
    if (dx || dy) {
      this.player.x = Phaser.Math.Clamp(this.player.x + vector.x * speed, 80, 12400);
      this.player.y = Phaser.Math.Clamp(this.player.y + vector.y * speed, 510, 875);
      this.player.setRotation(Phaser.Math.Clamp(vector.x * 0.14, -0.14, 0.14));
      if (vector.x !== 0) this.player.setFlipX(vector.x < 0);
      this.distance = Math.max(this.distance, Math.floor(this.player.x - 300));
      if (Math.random() < 0.18) this.makeTrail();
    } else {
      this.player.setRotation(0);
    }
    while (this.player.x + 1500 > this.nextStrip && this.nextStrip < 11000) {
      this.spawnStrip(this.nextStrip);
      this.nextStrip += 1050;
    }
    if (this.nextStrip >= 11000 && !this.things.some((thing) => thing.kind === "gate")) this.spawnGate();
    this.findInteractTarget();
    this.refreshHud();
  }

  private addFieldSections() {
    const sections = ["expedition-meadow", "expedition-crystal", "expedition-meadow", "expedition-crystal", "expedition-gate", "expedition-gate"];
    sections.forEach((key, index) => {
      this.add.image(960 + index * 1920, 540, key).setDisplaySize(1920, 1080).setDepth(-5);
    });
    this.add.rectangle(6400, 910, 12800, 180, 0x061a1d, 0.12).setDepth(-4);
  }

  private spawnStrip(x: number) {
    const propKeys = ["prop_grass", "prop_flowers", "prop_mushrooms", "prop_crystal", "prop_rock", "prop_pillar", "prop_ruin", "prop_bush", "prop_log", "prop_rune"];
    for (let index = 0; index < 4; index += 1) {
      const prop = this.add.image(x + 80 + index * 220 + Phaser.Math.Between(-45, 45), Phaser.Math.Between(600, 855), Phaser.Utils.Array.GetRandom(propKeys));
      prop.setDisplaySize(Phaser.Math.Between(100, 165), Phaser.Math.Between(100, 165)).setDepth(2).setAlpha(0.92);
    }
    const roll = Math.random();
    const count = roll < 0.25 ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      const eventX = x + 260 + index * 390 + Phaser.Math.Between(-50, 50);
      const eventY = Phaser.Math.Between(610, 790);
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
    const sprite = this.add.image(x, y, `field_${creature.id}`).setDisplaySize(155, 155).setDepth(5);
    const label = wildsText(this, x, y - 104, creature.rarity.toUpperCase(), 13, rarityColor[creature.rarity]).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: sprite, y: y - 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.things.push({ kind: "wild", creatureId: creature.id, sprite, label, used: false });
  }

  private spawnPickup(x: number, y: number) {
    const kind = Phaser.Utils.Array.GetRandom(["coin", "coin", "heal", "shield", "power", "lucky", "hint"] as ThingKind[]);
    const sprite = this.add.image(x, y, `pickup_${kind}`).setDisplaySize(100, 112).setDepth(5);
    this.tweens.add({ targets: sprite, y: y - 12, duration: 850, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.things.push({ kind, sprite, used: false });
  }

  private spawnGate() {
    const sprite = this.add.image(11200, 670, "field_warden_wisp").setDisplaySize(265, 265).setDepth(6);
    this.add.image(11200, 735, "prop_ruin").setDisplaySize(330, 330).setDepth(4);
    const label = wildsText(this, 11200, 515, "RIFT GATE", 18, "#ffdf91").setOrigin(0.5).setDepth(7);
    this.things.push({ kind: "gate", creatureId: "warden_wisp", sprite, label, used: false });
    this.showPrompt("The Rift Gate has opened ahead. Prepare for Warden Wisp.");
  }

  private createHud() {
    this.add.rectangle(440, 78, 760, 116, 0x06172a, 0.78).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x83f3de, 0.5);
    this.hud = wildsText(this, 92, 47, "", 21, "#f7fffb", { lineSpacing: 8 }).setScrollFactor(0).setDepth(21);
    this.prompt = wildsText(this, 960, 950, "", 20, "#ffffff", { align: "center", wordWrap: { width: 980 } }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
  }

  private createTargetMarker() {
    const ring = this.add.circle(0, 0, 55, 0x8effde, 0.12).setStrokeStyle(3, 0xc9fff0, 0.9);
    const key = wildsText(this, 0, 0, "E", 22, "#ffffff").setOrigin(0.5);
    this.targetMarker = this.add.container(0, 0, [ring, key]).setDepth(12).setVisible(false);
    this.tweens.add({ targets: this.targetMarker, scale: 1.12, duration: 560, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private createTouchControls() {
    const base = this.add.circle(150, 905, 78, 0x071a32, 0.62).setStrokeStyle(3, 0x9addec, 0.6).setScrollFactor(0).setDepth(30).setInteractive();
    const knob = this.add.circle(150, 905, 30, 0x8ff7dd, 0.8).setScrollFactor(0).setDepth(31);
    const interact = this.add.rectangle(1750, 900, 210, 112, 0x1bb687, 0.9).setStrokeStyle(3, 0xd8fff1, 0.75).setScrollFactor(0).setDepth(30).setInteractive({ useHandCursor: true });
    wildsText(this, 1750, 900, "INTERACT\n[E]", 19, "#ffffff", { align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
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
    const nearest = this.things.filter((thing) => !thing.used).map((thing) => ({ thing, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, thing.sprite.x, thing.sprite.y) })).sort((a, b) => a.distance - b.distance)[0];
    this.interactTarget = nearest && nearest.distance < 150 ? nearest.thing : null;
    if (!this.interactTarget) {
      this.targetMarker.setVisible(false);
      return;
    }
    this.targetMarker.setVisible(true).setPosition(this.interactTarget.sprite.x, this.interactTarget.sprite.y - 100);
    this.showPrompt(this.interactTarget.kind === "wild" || this.interactTarget.kind === "gate" ? "Wild spotted. Press E or INTERACT to begin a quiz battle." : "Reward nearby. Press E or INTERACT to collect it.");
  }

  private tryInteract() {
    if (!this.interactTarget || this.battleOpen) return;
    const target = this.interactTarget;
    if (target.kind === "wild" || target.kind === "gate") this.startBattle(target);
    else this.collectPickup(target);
  }

  private collectPickup(target: WorldThing) {
    target.used = true;
    target.label?.destroy();
    this.targetMarker.setVisible(false);
    this.burst(target.sprite.x, target.sprite.y, target.kind === "heal" ? 0xff91a4 : 0x8fffe4);
    target.sprite.destroy();
    if (target.kind === "coin") { this.coins += 8; this.showPrompt("Found 8 Wild Coins!"); }
    if (target.kind === "heal") { this.hp = Math.min(5, this.hp + 1); this.showPrompt("Healing Capsule: restored 1 heart."); }
    if (target.kind === "shield") { this.shield += 1; this.showPrompt("Shield Capsule: blocks your next wrong answer."); }
    if (target.kind === "power") { this.power += 1; this.showPrompt("Power Capsule: your next correct answer hits twice."); }
    if (target.kind === "lucky") { this.lucky += 0.2; this.showPrompt("Lucky Capsule: capture chance increased."); }
    if (target.kind === "hint") { this.hints += 1; this.showPrompt("Hint Scroll: the next battle removes two wrong answers."); }
  }

  private startBattle(target: WorldThing) {
    const creature = CREATURES.find((entry) => entry.id === target.creatureId)!;
    this.battleOpen = true;
    this.targetMarker.setVisible(false);
    let enemyHp = creature.hp;
    const overlay = this.add.rectangle(960, 540, 1920, 1080, 0x041224, 0.9).setScrollFactor(0).setDepth(50);
    const portrait = this.add.image(960, 245, `field_${creature.id}`).setDisplaySize(260, 260).setScrollFactor(0).setDepth(52);
    const title = wildsText(this, 960, 92, `${creature.name.toUpperCase()}  ${enemyHp}/${creature.hp}`, 32, rarityColor[creature.rarity]).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const questionText = wildsText(this, 960, 430, "", 27, "#ffffff", { align: "center", wordWrap: { width: 1040 } }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const feedback = wildsText(this, 960, 545, "", 22, "#d8fff0", { align: "center", wordWrap: { width: 980 } }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    const buttons: Phaser.GameObjects.Container[] = [];
    const close = () => { [overlay, portrait, title, questionText, feedback, ...buttons].forEach((object) => object.destroy()); this.battleOpen = false; };
    const showQuestion = () => {
      const question = EASY_QUESTIONS[this.questionIndex++ % EASY_QUESTIONS.length];
      const useHint = this.hints > 0;
      if (useHint) this.hints -= 1;
      questionText.setText(question.prompt);
      feedback.setText(useHint ? "Hint active: two wrong answers have faded." : "Choose the right answer to damage the Wild.");
      buttons.forEach((button, index) => {
        const label = button.getData("label") as Phaser.GameObjects.Text;
        label.setText(question.choices[index]);
        const wrongChoices = [0, 1, 2, 3].filter((choice) => choice !== question.answer);
        const hiddenByHint = useHint && wrongChoices.slice(0, 2).includes(index);
        button.setVisible(true).setActive(true).setAlpha(hiddenByHint ? 0.22 : 1);
        button.setInteractive({ useHandCursor: true });
        button.once("pointerup", () => {
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
        this.showPrompt(`${creature.name} joined your Verdant Rift collection!`);
      } else {
        this.showPrompt(`${creature.name} escaped, but you earned Wild Coins.`);
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
    const hearts = "♥".repeat(this.hp) + "♡".repeat(5 - this.hp);
    this.hud.setText(`VERDANT RIFT   ${this.distance}m / 10,000m\n${hearts}   Coins ${this.coins}   Catches ${this.captures}   Shield ${this.shield}   Power ${this.power}`);
  }

  private showPrompt(message: string) { this.prompt.setText(message); }

  private makeTrail() {
    const trail = this.add.circle(this.player.x - 28, this.player.y + 35, Phaser.Math.Between(4, 8), 0xa2fff0, 0.7).setDepth(7);
    this.tweens.add({ targets: trail, alpha: 0, scale: 2.2, duration: 450, onComplete: () => trail.destroy() });
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
    const cap = this.add.image(960, 660, "wilds-player-cap").setDisplaySize(145, 145).setScrollFactor(0).setDepth(62);
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
