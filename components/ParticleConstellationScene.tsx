"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  attribute vec3 aColor;
  uniform float uTime;
  uniform vec3 uMouse;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Deterministic smooth drift — seeded from base position
    float t = uTime;
    float ox = sin(position.x * 1.4 + t * 0.07) * 0.6 + cos(position.y * 1.1 + t * 0.05) * 0.3;
    float oy = cos(position.y * 1.2 + t * 0.06) * 0.5 + sin(position.z * 0.8 + t * 0.08) * 0.2;
    float oz = sin(position.z * 1.0 + t * 0.09) * 0.35 + cos(position.x * 0.9 + t * 0.04) * 0.2;

    vec3 pos = position + vec3(ox, oy, oz);

    // Mouse repulsion on the XY plane (z=0 world plane)
    float dist = distance(pos.xy, uMouse.xy);
    float repulse = max(0.0, 1.0 - dist / 2.4) * 2.8;
    vec2 dir = normalize(pos.xy - uMouse.xy + vec2(0.0001));
    pos.xy += dir * repulse;

    vColor = aColor;

    // Fade particles at the edges so they vanish into the background
    float edgeFadeX = 1.0 - smoothstep(6.5, 9.0, abs(pos.x));
    float edgeFadeY = 1.0 - smoothstep(3.0, 5.0, abs(pos.y));
    vAlpha = edgeFadeX * edgeFadeY;

    // Deeper particles are slightly larger
    float depthFactor = clamp((pos.z + 2.5) / 5.0, 0.0, 1.0);
    gl_PointSize = mix(1.5, 4.0, depthFactor);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vColor, soft * vAlpha * 0.65);
  }
`;

// Navy, teal, amber palette — contrast against cream bg
const PALETTE: [number, number, number][] = [
  [0.059, 0.196, 0.369],  // navy-700
  [0.051, 0.145, 0.282],  // navy-900
  [0.086, 0.533, 0.498],  // teal-600
  [0.047, 0.365, 0.361],  // teal-700
  [0.173, 0.784, 0.749],  // teal-400 (bright accent)
  [0.980, 0.620, 0.043],  // amber-400
];

const WEIGHTS = [0.32, 0.28, 0.18, 0.12, 0.06, 0.04];

function weightedColor(rng: number): [number, number, number] {
  let cum = 0;
  for (let i = 0; i < PALETTE.length; i++) {
    cum += WEIGHTS[i];
    if (rng < cum) return PALETTE[i];
  }
  return PALETTE[0];
}

export default function ParticleConstellationScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const COUNT = 2500;
    const positions = new Float32Array(COUNT * 3);
    const colorArr = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      const c = weightedColor(Math.random());
      colorArr[i * 3]     = c[0];
      colorArr[i * 3 + 1] = c[1];
      colorArr[i * 3 + 2] = c[2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colorArr, 3));

    const uMouse = new THREE.Vector3(99999, 0, 0);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: uMouse },
      },
      transparent: true,
      depthWrite: false,
    });

    scene.add(new THREE.Points(geometry, material));

    const clock = new THREE.Clock();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      if (
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom
      ) {
        uMouse.set(99999, 0, 0);
        return;
      }
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // Unproject onto z=0 plane
      const ray = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      ray.sub(camera.position).normalize();
      const t2 = -camera.position.z / ray.z;
      uMouse.copy(camera.position).addScaledVector(ray, t2);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };

    let frame = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = reduced ? 0 : t;
      if (!reduced) {
        camera.position.x = Math.sin(t * 0.018) * 0.4;
        camera.position.y = Math.cos(t * 0.013) * 0.2;
        camera.lookAt(0, 0, 0);
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
      window.removeEventListener("mousemove", handleMouseMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      geometry.dispose();
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
