"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type SceneObjective = "navigator" | "astrolabe" | "observation" | "complete";

type Props = {
  objective: SceneObjective;
  quality: "auto" | "high" | "chromebook";
  reducedMotion: boolean;
  pointerLock: boolean;
  onNearChange: (target: "navigator" | "astrolabe" | "observation" | null) => void;
  onPosition: (position: { x: number; z: number }) => void;
};

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function addRope(scene: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, color = 0x49311f) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, direction.length(), 7), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  rope.position.copy(a).add(b).multiplyScalar(.5);
  rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  scene.add(rope);
}

function createAstrolabe() {
  const group = new THREE.Group();
  group.name = "astrolabe";
  const brass = new THREE.MeshStandardMaterial({ color: 0xc99638, metalness: .86, roughness: .26, emissive: 0x2a1500, emissiveIntensity: .18 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x6c431a, metalness: .7, roughness: .32 });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(.28, .035, 12, 64), brass);
  const crossA = new THREE.Mesh(new THREE.BoxGeometry(.48, .025, .026), dark);
  const crossB = crossA.clone(); crossB.rotation.z = Math.PI / 2;
  const alidade = new THREE.Mesh(new THREE.BoxGeometry(.6, .035, .045), brass); alidade.position.z = .035; alidade.rotation.z = -.35; alidade.name = "alidade";
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.07, .018, 10, 32), brass); ring.position.y = .35;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .08, 20), dark); pin.rotation.x = Math.PI / 2;
  group.add(outer, crossA, crossB, alidade, ring, pin);
  return group;
}

export default function TakeAStarScene({ objective, quality, reducedMotion, pointerLock, onNearChange, onPosition }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const objectiveRef = useRef(objective);
  const callbacksRef = useRef({ onNearChange, onPosition });
  useEffect(() => { objectiveRef.current = objective; }, [objective]);
  useEffect(() => { callbacksRef.current = { onNearChange, onPosition }; }, [onNearChange, onPosition]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !window.WebGLRenderingContext) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x83b8cd);
    scene.fog = new THREE.Fog(0x8ab6c5, 24, 82);
    const camera = new THREE.PerspectiveCamera(68, 1, .08, 140);
    camera.position.set(0, 2.05, 5.5);
    const renderer = new THREE.WebGLRenderer({ antialias: quality !== "chromebook", powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "high" ? 1.8 : quality === "chromebook" ? 1 : 1.35));
    renderer.shadowMap.enabled = quality !== "chromebook";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd9f0ff, 0x594020, 2.1));
    const sun = new THREE.DirectionalLight(0xffe5ae, 3.2); sun.position.set(-12, 18, 8); sun.castShadow = quality !== "chromebook"; scene.add(sun);
    const sunDisk = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffe8a5 })); sunDisk.position.set(-25, 23, -55); scene.add(sunDisk);

    const world = new THREE.Group(); scene.add(world);
    const placeholderShip = new THREE.Group(); world.add(placeholderShip);
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5732, roughness: .88, metalness: .02 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3f281d, roughness: .92 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0xe6d3a5, roughness: .93, side: THREE.DoubleSide });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(9.2, .35, 18), wood); deck.position.y = .1; deck.receiveShadow = true; placeholderShip.add(deck);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5.5, 4), wood); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, .1, -11); placeholderShip.add(bow);
    [-4.5, 4.5].forEach((x) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.2, 17.5), darkWood); rail.position.set(x, .8, 0); rail.castShadow = true; placeholderShip.add(rail); });
    for (let z = -7; z <= 7; z += 2) for (const x of [-4.25, 4.25]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, 1.55, 8), darkWood); post.position.set(x, 1.35, z); placeholderShip.add(post); }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 13, 14), darkWood); mast.position.set(0, 6.4, -.7); mast.castShadow = true; placeholderShip.add(mast);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, 9, 10), darkWood); yard.rotation.z = Math.PI / 2; yard.position.set(0, 8.4, -.7); placeholderShip.add(yard);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 5.2, 7, 5), cloth); sail.position.set(0, 5.7, -.75); sail.rotation.y = .03; sail.castShadow = true; placeholderShip.add(sail);
    addRope(placeholderShip, new THREE.Vector3(0, 12.8, -.7), new THREE.Vector3(-4.2, 1.4, 7.5));
    addRope(placeholderShip, new THREE.Vector3(0, 12.8, -.7), new THREE.Vector3(4.2, 1.4, 7.5));
    addRope(placeholderShip, new THREE.Vector3(-4.4, 8.4, -.7), new THREE.Vector3(-4.2, 1.4, -6.5));
    addRope(placeholderShip, new THREE.Vector3(4.4, 8.4, -.7), new THREE.Vector3(4.2, 1.4, -6.5));

    const cargoMaterial = new THREE.MeshStandardMaterial({ color: 0x9b6c3d, roughness: 1 });
    [[-3, .65, 3], [3.1, .65, 2], [-3.2, .65, -4]].forEach(([x, y, z]) => { const crate = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.1, 1.35), cargoMaterial); crate.position.set(x, y, z); crate.castShadow = true; world.add(crate); });
    for (let i = 0; i < 4; i++) { const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.48, .55, 1.15, 14), darkWood); barrel.position.set(2.8 + (i % 2) * 1.15, .72, 5.7 + Math.floor(i / 2) * 1.15); barrel.castShadow = true; world.add(barrel); }

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.3, .12, 1.4), darkWood); table.position.set(-2.6, 1.12, 6); world.add(table);
    for (const x of [-3.45, -1.75]) for (const z of [5.5, 6.5]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.1, .12), darkWood); leg.position.set(x, .58, z); world.add(leg); }
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .88), new THREE.MeshStandardMaterial({ color: 0xd8c18d, roughness: .8, side: THREE.DoubleSide })); map.rotation.x = -Math.PI / 2; map.position.set(-2.6, 1.2, 6); world.add(map);
    const astrolabe = createAstrolabe(); astrolabe.position.set(-2.55, 1.38, 5.75); astrolabe.rotation.x = -Math.PI / 2; world.add(astrolabe);

    const humanMaterial = new THREE.MeshStandardMaterial({ color: 0x352d2a, roughness: 1 });
    function crew(x: number, z: number, coat: number) { const group = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 1.15, 5, 10), new THREE.MeshStandardMaterial({ color: coat, roughness: .9 })); body.position.y = 1.05; const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 14, 12), humanMaterial); head.position.y = 1.98; group.add(body, head); group.position.set(x, .2, z); world.add(group); return group; }
    const navigator = crew(2.7, -3.7, 0x384d5f); navigator.name = "navigator";
    crew(-3.2, -6.2, 0x6b3d2d); crew(3.4, 7, 0x4f5740);
    const observation = new THREE.Mesh(new THREE.RingGeometry(.7, .86, 48), new THREE.MeshBasicMaterial({ color: 0xffd36b, side: THREE.DoubleSide, transparent: true, opacity: .78 })); observation.rotation.x = -Math.PI / 2; observation.position.set(0, .3, -7); observation.name = "observation"; world.add(observation);

    const loader = new GLTFLoader();
    loader.load("/models/take-a-star/dutch-ship-medium.glb", (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(model); let size = box.getSize(new THREE.Vector3());
      if (size.y > Math.max(size.x, size.z) * 1.2) { model.rotation.x = Math.PI / 2; model.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(model); size = box.getSize(new THREE.Vector3()); }
      const horizontalLength = Math.max(size.x, size.z); model.scale.setScalar(26 / horizontalLength); model.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(model); const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x; model.position.z -= center.z; model.position.y += -3.15 - box.min.y;
      model.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = quality !== "chromebook"; child.receiveShadow = true; } });
      world.add(model); placeholderShip.visible = false;
    }, undefined, () => { placeholderShip.visible = true; });

    loader.load("/models/take-a-star/navigator.glb", (gltf) => {
      const model = gltf.scene; model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
      model.scale.setScalar(1.82 / Math.max(size.y, .001)); model.position.set(2.7 - center.x * model.scale.x, .18 - box.min.y * model.scale.y, -3.7 - center.z * model.scale.z); model.rotation.y = Math.PI;
      model.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = quality !== "chromebook"; child.receiveShadow = true; } });
      world.add(model); navigator.visible = false;
    });
    loader.load("/models/take-a-star/astrolabe-medieval-reconstruction.glb", (gltf) => {
      const model = gltf.scene; model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3()); const scale = .72 / Math.max(size.x, size.y);
      model.scale.setScalar(scale); model.position.set(-2.55 - center.x * scale, 1.39 - center.z * scale, 5.75 + center.y * scale); model.rotation.x = -Math.PI / 2; model.rotation.z = Math.PI;
      model.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = quality !== "chromebook"; child.receiveShadow = true; } });
      world.add(model); astrolabe.visible = false;
    });

    const waterGeometry = new THREE.PlaneGeometry(180, 180, quality === "chromebook" ? 18 : 46, quality === "chromebook" ? 18 : 46);
    const water = new THREE.Mesh(waterGeometry, new THREE.MeshStandardMaterial({ color: 0x0b5870, roughness: .28, metalness: .1, transparent: true, opacity: .96 })); water.rotation.x = -Math.PI / 2; water.position.y = -.55; scene.add(water);
    const baseWater = Float32Array.from(waterGeometry.attributes.position.array as ArrayLike<number>);
    const coast = new THREE.Mesh(new THREE.PlaneGeometry(28, 7, 10, 2), new THREE.MeshStandardMaterial({ color: 0x776b3f, roughness: 1, side: THREE.DoubleSide })); coast.position.set(22, 1.5, -45); coast.rotation.x = -.18; scene.add(coast);

    const keys = new Set<string>(); let yaw = 0; let pitch = -.05; let targetYaw = 0; let targetPitch = -.05; let dragging = false; let lastX = 0; let lastY = 0; let near: "navigator" | "astrolabe" | "observation" | null = null; const velocity = new THREE.Vector3();
    const onKeyDown = (e: KeyboardEvent) => keys.add(e.code); const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onMouseMove = (e: MouseEvent) => { if (document.pointerLockElement === renderer.domElement || dragging) { const dx = document.pointerLockElement ? e.movementX : e.clientX - lastX; const dy = document.pointerLockElement ? e.movementY : e.clientY - lastY; targetYaw -= dx * .00175; targetPitch = THREE.MathUtils.clamp(targetPitch - dy * .0016, -.68, .58); lastX = e.clientX; lastY = e.clientY; } };
    const onPointerDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; if (pointerLock && e.pointerType === "mouse") renderer.domElement.requestPointerLock?.(); };
    const onPointerUp = () => dragging = false;
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("mousemove", onMouseMove); renderer.domElement.addEventListener("pointerdown", onPointerDown); window.addEventListener("pointerup", onPointerUp);

    const resize = () => { renderer.setSize(mount.clientWidth, mount.clientHeight, false); camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight); camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize); resize();
    const clock = new THREE.Clock(); let frame = 0; let lastReport = 0;
    const animate = () => {
      const dt = Math.min(clock.getDelta(), .04); const t = clock.elapsedTime;
      yaw = THREE.MathUtils.lerp(yaw, targetYaw, 1 - Math.exp(-dt * 18)); pitch = THREE.MathUtils.lerp(pitch, targetPitch, 1 - Math.exp(-dt * 18));
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); const desired = new THREE.Vector3();
      if (keys.has("KeyW") || keys.has("ArrowUp")) desired.add(forward); if (keys.has("KeyS") || keys.has("ArrowDown")) desired.sub(forward); if (keys.has("KeyD") || keys.has("ArrowRight")) desired.add(right); if (keys.has("KeyA") || keys.has("ArrowLeft")) desired.sub(right);
      if (desired.lengthSq()) desired.normalize().multiplyScalar(2.45);
      velocity.lerp(desired, 1 - Math.exp(-dt * (desired.lengthSq() ? 11 : 7))); camera.position.addScaledVector(velocity, dt);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.75, 3.75); camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8.2, 8.2); camera.position.y = 2.05;
      camera.rotation.order = "YXZ"; camera.rotation.y = yaw; camera.rotation.x = pitch; camera.rotation.z = 0;
      world.rotation.z = reducedMotion ? 0 : Math.sin(t * .43) * .012; world.rotation.x = reducedMotion ? 0 : Math.sin(t * .31) * .005;
      const pos = waterGeometry.attributes.position as THREE.BufferAttribute; if (quality !== "chromebook") { for (let i = 0; i < pos.count; i++) { const ix = i * 3; pos.setZ(i, baseWater[ix + 2] + Math.sin(baseWater[ix] * .14 + t) * .18 + Math.cos(baseWater[ix + 1] * .12 + t * .7) * .12); } pos.needsUpdate = true; waterGeometry.computeVertexNormals(); } else water.position.y = -.55 + Math.sin(t) * .05;
      astrolabe.rotation.z = t * .25; observation.material.opacity = .48 + Math.sin(t * 2) * .25;
      const objectiveNow = objectiveRef.current; let candidate: typeof near = null;
      if (objectiveNow === "navigator" && camera.position.distanceTo(new THREE.Vector3(2.7, 2.05, -3.7)) < 2.15) candidate = "navigator";
      if (objectiveNow === "astrolabe" && camera.position.distanceTo(new THREE.Vector3(-2.55, 2.05, 5.75)) < 2.05) candidate = "astrolabe";
      if (objectiveNow === "observation" && camera.position.distanceTo(new THREE.Vector3(0, 2.05, -7)) < 1.5) candidate = "observation";
      if (candidate !== near) { near = candidate; callbacksRef.current.onNearChange(near); }
      if (t - lastReport > .25) { lastReport = t; callbacksRef.current.onPosition({ x: camera.position.x, z: camera.position.z }); }
      renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("pointerup", onPointerUp); renderer.domElement.removeEventListener("pointerdown", onPointerDown); if (document.pointerLockElement === renderer.domElement) document.exitPointerLock(); mount.removeChild(renderer.domElement); disposeObject(scene); renderer.dispose(); };
  }, [quality, reducedMotion, pointerLock]);

  return <div ref={mountRef} className="absolute inset-0 touch-none" aria-label="First-person view from the deck of a sailing ship in the Indian Ocean" role="application" />;
}
