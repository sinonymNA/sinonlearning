"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  attribute float aA;        // semi-major axis
  attribute float aB;        // semi-minor axis
  attribute float aInclX;    // inclination around X
  attribute float aInclY;    // inclination around Y
  attribute float aPhase;    // starting orbital phase
  attribute float aSpeed;    // angular velocity (rad/s)
  attribute float aColorT;   // 0=inner teal, 1=outer navy

  uniform float uTime;
  varying float vColorT;
  varying float vFade;

  void main() {
    float angle = aPhase + uTime * aSpeed;

    // Elliptical orbit in local XZ plane
    float px = aA * cos(angle);
    float py = 0.0;
    float pz = aB * sin(angle);

    // Rotate around X axis (inclination tilt)
    float cx = cos(aInclX), sx = sin(aInclX);
    float py1 = py * cx - pz * sx;
    float pz1 = py * sx + pz * cx;
    py = py1; pz = pz1;

    // Rotate around Y axis (orbital plane orientation)
    float cy = cos(aInclY), sy = sin(aInclY);
    float px2 = px * cy + pz * sy;
    float pz2 = -px * sy + pz * cy;
    px = px2; pz = pz2;

    vec3 pos = vec3(px, py, pz);

    vColorT = aColorT;

    // Fade outer particles gently
    vFade = 1.0 - smoothstep(3.2, 4.2, aA);

    gl_PointSize = 2.2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying float vColorT;
  varying float vFade;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);

    // teal-400 → teal-600 → navy-800
    vec3 inner  = vec3(0.173, 0.784, 0.749);   // #2dd4bf teal-300 (fast inner)
    vec3 mid    = vec3(0.051, 0.502, 0.467);   // #0d9488 teal-600
    vec3 outer  = vec3(0.059, 0.196, 0.369);   // #0f3260 navy

    vec3 color;
    if (vColorT < 0.5) {
      color = mix(inner, mid, vColorT * 2.0);
    } else {
      color = mix(mid, outer, (vColorT - 0.5) * 2.0);
    }

    gl_FragColor = vec4(color, soft * vFade * 0.72);
  }
`;

export default function GravityWellScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 40);
    // Elevated angle — looking down into the orbital plane
    camera.position.set(0, 2.8, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const COUNT = 1200;
    const aArr = new Float32Array(COUNT);
    const bArr = new Float32Array(COUNT);
    const inclXArr = new Float32Array(COUNT);
    const inclYArr = new Float32Array(COUNT);
    const phaseArr = new Float32Array(COUNT);
    const speedArr = new Float32Array(COUNT);
    const colorTArr = new Float32Array(COUNT);
    // positions: all zero (actual positions computed in shader)
    const posArr = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const radius = 0.3 + Math.random() * 3.9;  // 0.3 – 4.2
      const ecc = 0.55 + Math.random() * 0.42;    // eccentricity factor
      aArr[i] = radius;
      bArr[i] = radius * ecc;
      inclXArr[i] = (Math.random() - 0.5) * Math.PI;          // -90° to +90°
      inclYArr[i] = Math.random() * Math.PI * 2;               // full 360°
      phaseArr[i] = Math.random() * Math.PI * 2;
      // Kepler-like: inner = faster. v ∝ 1/sqrt(r)
      speedArr[i] = (0.18 + Math.random() * 0.12) / Math.sqrt(radius);
      colorTArr[i] = Math.min(1.0, radius / 4.2);              // 0=inner, 1=outer
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geometry.setAttribute("aA", new THREE.BufferAttribute(aArr, 1));
    geometry.setAttribute("aB", new THREE.BufferAttribute(bArr, 1));
    geometry.setAttribute("aInclX", new THREE.BufferAttribute(inclXArr, 1));
    geometry.setAttribute("aInclY", new THREE.BufferAttribute(inclYArr, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phaseArr, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speedArr, 1));
    geometry.setAttribute("aColorT", new THREE.BufferAttribute(colorTArr, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });

    scene.add(new THREE.Points(geometry, material));

    const clock = new THREE.Clock();

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
        // Very slow camera orbit around Y axis — makes the 3D orbital structure apparent
        const camAngle = t * 0.025;
        camera.position.x = Math.sin(camAngle) * 5.5;
        camera.position.z = Math.cos(camAngle) * 5.5;
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
