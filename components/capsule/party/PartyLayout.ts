import Phaser from "phaser";

export const PARTY_WIDTH = 800;
export const PARTY_HEIGHT = 450;
export const PARTY_RENDER_SCALE = 1.5;

export function configurePartyCamera(scene: Phaser.Scene) {
  scene.cameras.main.setOrigin(0, 0).setZoom(PARTY_RENDER_SCALE);
}

