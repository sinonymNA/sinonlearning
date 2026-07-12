"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ShipConfig {
  cx: number; cy: number; cz: number;   // center offset
  rx: number; ry: number; rz: number;   // arc radii
  sx: number; sy: number; sz: number;   // frequency multipliers per axis
  px: number; py: number; pz: number;   // phase offsets
  speed: number;
  engineColor: number;
  scale: number;
}

const TAU = Math.PI * 2;

const SHIPS: ShipConfig[] = [
  // Wide sweeper — teal engine, slow
  { cx: 0, cy:  0.2, cz:  0.5, rx: 9,   ry: 1.2, rz: 1.8, sx: 1, sy: 0.5, sz: 0.7, px: 0,          py: 1.2, pz: 0.5, speed: 0.055, engineColor: 0x2dd4bf, scale: 0.65 },
  // Upper diagonal — amber engine
  { cx: 0, cy:  1.2, cz: -0.8, rx: 8,   ry: 0.8, rz: 1.5, sx: 1, sy: 0.6, sz: 0.8, px: Math.PI,    py: 0.8, pz: 1.8, speed: 0.07,  engineColor: 0xfbbf24, scale: 0.55 },
  // Lower, faster — violet engine
  { cx: 0, cy: -1.0, cz:  0.8, rx: 7.5, ry: 0.6, rz: 1.2, sx: 1, sy: 0.7, sz: 0.9, px: Math.PI/2, py: 2.0, pz: 0.3, speed: 0.09,  engineColor: 0x9b4dff, scale: 0.5  },
  // Background, slowest — emerald engine
  { cx: 0, cy:  0.6, cz: -2.0, rx: 10,  ry: 0.5, rz: 0.8, sx: 1, sy: 0.4, sz: 0.6, px: TAU*0.35,  py: 0.5, pz: 1.2, speed: 0.038, engineColor: 0x34d399, scale: 0.45 },
  // Foreground crossing — sky-blue engine
  { cx: 0, cy: -0.5, cz:  1.5, rx: 8.5, ry: 1.5, rz: 1.0, sx: 1, sy: 0.8, sz: 1.1, px: TAU*0.65,  py: 1.6, pz: 0.9, speed: 0.062, engineColor: 0x60a5fa, scale: 0.58 },
];

// Shared vectors — allocated once, reused every frame (zero GC pressure)
const FORWARD = new THREE.Vector3(1, 0, 0);

function buildShip(engineColor: number): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7,  roughness: 0.4  });

  // Fuselage — cone oriented along +X
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.36, 5), bodyMat);
  body.rotation.z = -Math.PI / 2;
  group.add(body);

  // Wing spar
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.018, 0.11), wingMat);
  group.add(wing);

  // Engine glow — small unlit sphere at rear
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 6, 6),
    new THREE.MeshBasicMaterial({ color: engineColor })
  );
  glow.position.x = -0.2;
  group.add(glow);

  // Engine point light
  const light = new THREE.PointLight(engineColor, 4, 2.4, 1.8);
  light.position.x = -0.2;
  group.add(light);

  return group;
}

function setPos(v: THREE.Vector3, cfg: ShipConfig, t: number) {
  const { cx, cy, cz, rx, ry, rz, sx, sy, sz, px, py, pz, speed } = cfg;
  v.set(
    cx + rx * Math.cos(sx * speed * t + px),
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

    // Lights
    scene.add(new THREE.AmbientLight(0xe2e8f0, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    // Ships
    const ships = SHIPS.map((cfg) => {
      const group = buildShip(cfg.engineColor);
      group.scale.setScalar(cfg.scale);
      scene.add(group);
      return { group, cfg };
    });

    // Pre-allocate — never allocate inside the animation loop
    const _pos  = new THREE.Vector3();
    const _next = new THREE.Vector3();
    const _tan  = new THREE.Vector3();

    const clock = new THREE.Clock();

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };

    let frame = 0;
    const tick = () => {
      const t = reduced ? 0 : clock.getElapsedTime();

      for (const { group, cfg } of ships) {
        setPos(_pos, cfg, t);
        group.position.copy(_pos);

        if (!reduced) {
          // Orient along velocity direction (sampled 50ms ahead)
          setPos(_next, cfg, t + 0.05);
          _tan.copy(_next).sub(_pos);
          if (_tan.lengthSq() > 1e-6) {
            group.quaternion.setFromUnitVectors(FORWARD, _tan.normalize());
          }

          // Scale with z-depth for parallax feel
          const depth = clamp01((_pos.z + 2.5) / 4.5);
          group.scale.setScalar(cfg.scale * (0.72 + depth * 0.56));
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
