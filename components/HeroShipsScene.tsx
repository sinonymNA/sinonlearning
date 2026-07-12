"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ShipConfig {
  cx: number; cy: number; cz: number;
  rx: number; ry: number; rz: number;   // rx is in "design units" (desktop half-width = 6.3)
  sx: number; sy: number; sz: number;
  px: number; py: number; pz: number;
  speed: number;
  engineColor: number;
  scale: number;
}

const TAU = Math.PI * 2;

// rx values are relative to the design desktop half-width (~6.3 world units).
// They get multiplied by xScale at runtime so ships span the visible area on any viewport.
const SHIPS: ShipConfig[] = [
  { cx: 0, cy:  0.2, cz:  0.5, rx: 1.3, ry: 1.2, rz: 1.8, sx: 1, sy: 0.5, sz: 0.7, px: 0,        py: 1.2, pz: 0.5, speed: 0.055, engineColor: 0x2dd4bf, scale: 0.65 },
  { cx: 0, cy:  1.2, cz: -0.8, rx: 1.1, ry: 0.8, rz: 1.5, sx: 1, sy: 0.6, sz: 0.8, px: Math.PI,  py: 0.8, pz: 1.8, speed: 0.07,  engineColor: 0xfbbf24, scale: 0.55 },
  { cx: 0, cy: -1.0, cz:  0.8, rx: 1.0, ry: 0.6, rz: 1.2, sx: 1, sy: 0.7, sz: 0.9, px: Math.PI/2,py: 2.0, pz: 0.3, speed: 0.09,  engineColor: 0x9b4dff, scale: 0.5  },
  { cx: 0, cy:  0.6, cz: -2.0, rx: 1.5, ry: 0.5, rz: 0.8, sx: 1, sy: 0.4, sz: 0.6, px: TAU*0.35, py: 0.5, pz: 1.2, speed: 0.038, engineColor: 0x34d399, scale: 0.45 },
  { cx: 0, cy: -0.5, cz:  1.5, rx: 1.2, ry: 1.5, rz: 1.0, sx: 1, sy: 0.8, sz: 1.1, px: TAU*0.65, py: 1.6, pz: 0.9, speed: 0.062, engineColor: 0x60a5fa, scale: 0.58 },
];

const FORWARD = new THREE.Vector3(1, 0, 0);
const FOV_V_HALF_RAD = (54 / 2) * (Math.PI / 180);

function buildShip(engineColor: number): THREE.Group {
  const group = new THREE.Group();

  // Dark navy body — clearly visible against cream background
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.7, roughness: 0.3 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.35 });

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.38, 5), bodyMat);
  body.rotation.z = -Math.PI / 2;
  group.add(body);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.13), wingMat);
  group.add(wing);

  // Engine glow — larger and brighter than before
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 8, 8),
    new THREE.MeshBasicMaterial({ color: engineColor }),
  );
  glow.position.x = -0.21;
  group.add(glow);

  const light = new THREE.PointLight(engineColor, 5, 2.8, 1.6);
  light.position.x = -0.21;
  group.add(light);

  return group;
}

// xs = x-scale factor, computed per-resize to match visible viewport width
function setPos(v: THREE.Vector3, cfg: ShipConfig, t: number, xs: number) {
  const { cx, cy, cz, rx, ry, rz, sx, sy, sz, px, py, pz, speed } = cfg;
  v.set(
    cx + rx * xs * Math.cos(sx * speed * t + px),
    cy + ry * Math.sin(sy * speed * t + py),
    cz + rz * Math.sin(sz * speed * t + pz),
  );
}

export default function HeroShipsScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 50);
    camera.position.set(0, 0.5, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xdde8f0, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    const ships = SHIPS.map((cfg) => {
      const group = buildShip(cfg.engineColor);
      group.scale.setScalar(cfg.scale);
      scene.add(group);
      return { group, cfg };
    });

    const _pos  = new THREE.Vector3();
    const _next = new THREE.Vector3();
    const _tan  = new THREE.Vector3();
    const clock = new THREE.Clock();

    // xScale maps design rx values to the actual visible half-width each resize.
    // rx=1.0 means "traverse the full visible half-width"; 1.3 means "go 30% offscreen".
    let xScale = 6.3; // initialized to desktop design value; updated immediately on first resize

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      // Visible half-width at z=0: tan(fovV/2) * aspect * cameraZ
      xScale = Math.tan(FOV_V_HALF_RAD) * camera.aspect * camera.position.z;
    };

    let frame = 0;
    const tick = () => {
      const t = reduced ? 0 : clock.getElapsedTime();

      for (const { group, cfg } of ships) {
        setPos(_pos, cfg, t, xScale);
        group.position.copy(_pos);

        if (!reduced) {
          setPos(_next, cfg, t + 0.05, xScale);
          _tan.copy(_next).sub(_pos);
          if (_tan.lengthSq() > 1e-6) {
            group.quaternion.setFromUnitVectors(FORWARD, _tan.normalize());
          }
          // Scale up slightly when in the foreground (larger z)
          const depth = clamp01((_pos.z + 2.5) / 4.5);
          group.scale.setScalar(cfg.scale * (0.78 + depth * 0.48));
        }
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
