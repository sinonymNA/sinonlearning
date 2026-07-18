import Phaser from "phaser";
import { creatureById, getAbilities, rarityColor } from "../gameState";
import { fitBackground, wildsText } from "../Presentation";
import { createStarterRunSave, setRunSave } from "../save";

const STARTERS = ["sparkit", "mossprout", "aquablob"] as const;

export class StarterScene extends Phaser.Scene {
  constructor() {
    super({ key: "StarterScene" });
  }

  create() {
    this.cameras.main.fadeIn(220, 8, 18, 31);
    fitBackground(this, "title-bg");
    this.add.rectangle(960, 540, 1920, 1080, 0x08121f, 0.42);

    wildsText(this, 960, 110, "CHOOSE YOUR STARTER", 46, "#ffffff").setOrigin(0.5);
    wildsText(this, 960, 165, "Pick one Wild to lead your first run through Verdant Rift.", 22, "#d2f4ef").setOrigin(0.5);

    const abilities = getAbilities(this);
    const xPositions = [450, 960, 1470];

    STARTERS.forEach((id, index) => {
      const creature = creatureById(this, id);
      const x = xPositions[index];
      const y = 610;

      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 400, 620, 0x0f1f33, 0.9).setStrokeStyle(4, 0x5eead4, 0.5);
      const portrait = this.add.image(0, -150, creature.portrait).setDisplaySize(240, 240);
      const rarity = wildsText(this, 0, -15, creature.rarity.toUpperCase(), 16, rarityColor(creature.rarity)).setOrigin(0.5);
      const name = wildsText(this, 0, 28, creature.name.toUpperCase(), 34, "#ffffff").setOrigin(0.5);
      const element = wildsText(this, 0, 74, creature.element.toUpperCase(), 16, "#b6f4ff").setOrigin(0.5);
      const abilityName = wildsText(this, 0, 140, abilities[creature.ability]?.name ?? "Ability", 18, "#ffe08a", {
        align: "center",
        wordWrap: { width: 300 },
      }).setOrigin(0.5);
      const abilityDesc = wildsText(this, 0, 190, abilities[creature.ability]?.description ?? "", 14, "#d7e8f2", {
        align: "center",
        wordWrap: { width: 310 },
      }).setOrigin(0.5);
      const displayHp = creature.ability === "extra_hp" ? creature.maxHp + 10 : creature.maxHp;
      const hp = wildsText(this, -120, 285, `HP ${displayHp}`, 18, "#a7f3d0").setOrigin(0, 0.5);
      const atk = wildsText(this, 30, 285, `ATK ${creature.attack}`, 18, "#f9d17b").setOrigin(0, 0.5);

      const hitbox = this.add.rectangle(0, 0, 400, 620, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hitbox.on("pointerover", () => card.setScale(1.03));
      hitbox.on("pointerout", () => card.setScale(1));
      hitbox.on("pointerdown", () => card.setScale(0.98));
      hitbox.on("pointerup", () => {
        const run = createStarterRunSave(creature.id, creature.maxHp, creature.attack, creature.defense);
        if (creature.ability === "extra_hp") {
          run.maxHp += 10;
          run.currentHp += 10;
        }
        setRunSave(run);
        this.cameras.main.fadeOut(280, 8, 18, 31);
        this.time.delayedCall(280, () => this.scene.start("MapScene"));
      });

      card.add([bg, portrait, rarity, name, element, abilityName, abilityDesc, hp, atk, hitbox]);
    });
  }
}
