import Phaser from "phaser";

export function wildsText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color = "#ffffff",
  options: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
) {
  return scene.add.text(x, y, text, {
    fontFamily: "Nunito, sans-serif",
    fontSize: `${size}px`,
    fontStyle: "900",
    color,
    stroke: "#0b2035",
    strokeThickness: size >= 20 ? 6 : 4,
    lineSpacing: 4,
    ...options,
  });
}

export function fitBackground(scene: Phaser.Scene, key: string) {
  const bg = scene.add.image(960, 540, key);
  const scale = Math.max(1920 / bg.width, 1080 / bg.height);
  bg.setScale(scale);
  return bg;
}

export function imageButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  label: string,
  onClick: () => void,
  width?: number,
  height?: number,
) {
  const image = scene.add.image(0, 0, key).setInteractive({ useHandCursor: true });
  if (width && height) image.setDisplaySize(width, height);
  const children: Phaser.GameObjects.GameObject[] = [image];
  if (label) {
    children.push(wildsText(scene, 0, 0, label, 24, "#ffffff").setOrigin(0.5));
  }
  const container = scene.add.container(x, y, children);
  image.on("pointerover", () => container.setScale(1.03));
  image.on("pointerout", () => container.setScale(1));
  image.on("pointerdown", () => container.setScale(0.96));
  image.on("pointerup", () => { container.setScale(1.03); onClick(); });
  return container;
}
