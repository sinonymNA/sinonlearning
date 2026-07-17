import Phaser from "phaser";

export const PARTY_FONT = "Nunito, Arial, sans-serif";

export function partyText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: string,
  size: number,
  color = "#ffffff",
  options: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
) {
  return scene.add.text(x, y, value, {
    fontFamily: PARTY_FONT,
    fontSize: `${size}px`,
    fontStyle: "bold",
    color,
    resolution: 2,
    ...options,
  });
}

export function imageButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onPress: () => void,
  options: { width?: number; height?: number; secondary?: boolean; fontSize?: number } = {},
) {
  const width = options.width ?? 240;
  const height = options.height ?? 64;
  const container = scene.add.container(x, y);
  const plate = scene.add.image(0, 0, options.secondary ? "button-secondary" : "button-primary")
    .setDisplaySize(width, height);
  const hit = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  const labelText = partyText(
    scene,
    0,
    0,
    label,
    options.fontSize ?? 17,
    options.secondary ? "#ffffff" : "#07142f",
    { align: "center" },
  ).setOrigin(0.5);
  container.add([plate, labelText, hit]);
  hit.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.045, duration: 110 }));
  hit.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, duration: 110 }));
  hit.on("pointerdown", () => {
    hit.disableInteractive();
    scene.tweens.add({ targets: container, scale: 0.96, duration: 80, yoyo: true, onComplete: onPress });
  });
  return container;
}

export function presentationPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  texture = "panel-briefing",
) {
  return scene.add.image(x, y, texture).setDisplaySize(width, height);
}

