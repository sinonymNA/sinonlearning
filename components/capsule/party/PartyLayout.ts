import Phaser from "phaser";

export const PARTY_WIDTH = 800;
export const PARTY_HEIGHT = 450;
// 800x450 logical game units rendered into a native 1920x1080 canvas.
export const PARTY_RENDER_SCALE = 2.4;

export function configurePartyCamera(scene: Phaser.Scene) {
  scene.cameras.main.setOrigin(0, 0).setZoom(PARTY_RENDER_SCALE);
}

