"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
  #define N 8
  uniform vec2 uRes;
  uniform float uStr[N];
  uniform vec2 uPos[N];
  uniform vec3 uCol[N];

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float ar = uRes.x / uRes.y;
    vec2 st = vec2((uv.x - 0.5) * ar, uv.y - 0.5);

    float field = 0.0;
    vec3 weighted = vec3(0.0);

    for (int i = 0; i < N; i++) {
      vec2 bp = vec2((uPos[i].x - 0.5) * ar, uPos[i].y - 0.5);
      float d2 = max(dot(st - bp, st - bp), 0.0001);
      float c = uStr[i] / d2;
      field += c;
      weighted += uCol[i] * c;
    }

    vec3 color = weighted / max(field, 0.0001);
    float alpha = smoothstep(5.0, 11.0, field) * 0.22;
    gl_FragColor = vec4(color, alpha);
  }
`;

interface BlobConfig {
  str: number;
  col: [number, number, number];
  fx: number;
  fy: number;
  px: number;
  py: number;
}

const BLOBS: BlobConfig[] = [
  { str: 0.14, col: [0.173, 0.784, 0.749], fx: 0.80, fy: 1.10, px: 0.0, py: 0.7 }, // teal-400
  { str: 0.12, col: [0.984, 0.749, 0.141], fx: 1.30, fy: 0.70, px: 2.1, py: 1.4 }, // amber-400
  { str: 0.10, col: [0.612, 0.227, 0.996], fx: 0.50, fy: 1.40, px: 1.1, py: 3.1 }, // violet-500
  { str: 0.13, col: [0.129, 0.773, 0.529], fx: 1.10, fy: 0.90, px: 0.5, py: 0.2 }, // emerald-400
  { str: 0.11, col: [0.984, 0.247, 0.502], fx: 0.70, fy: 1.20, px: 3.8, py: 2.3 }, // rose-500
  { str: 0.12, col: [0.231, 0.659, 0.969], fx: 1.40, fy: 0.60, px: 1.8, py: 0.9 }, // sky-400
  { str: 0.09, col: [0.925, 0.361, 0.118], fx: 0.90, fy: 1.50, px: 4.2, py: 1.6 }, // orange-500
  { str: 0.11, col: [0.596, 0.161, 0.867], fx: 1.20, fy: 0.80, px: 2.7, py: 3.5 }, // purple-600
];

export default function LavaLampScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const positions = BLOBS.map(() => new THREE.Vector2(0.5, 0.5));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uStr: { value: BLOBS.map((b) => b.str) },
        uPos: { value: positions },
        uCol: { value: BLOBS.map((b) => new THREE.Color(...b.col)) },
      },
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      material.uniforms.uRes.value.set(w, h);
    };

    let frame = 0;
    const tick = () => {
      const t = reduced ? 0 : clock.getElapsedTime() * 0.35;
      BLOBS.forEach((b, i) => {
        positions[i].set(
          0.5 + Math.sin(b.fx * t + b.px) * 0.35,
          0.5 + Math.sin(b.fy * t + b.py) * 0.40,
        );
      });
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
      mesh.geometry.dispose();
      material.dispose();
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
