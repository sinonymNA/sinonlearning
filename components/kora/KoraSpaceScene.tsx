"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y), mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float value = 0.0; float amplitude = .5;
    for (int i = 0; i < 6; i++) { value += amplitude * noise(p); p = p * 2.03 + 7.13; amplitude *= .5; }
    return value;
  }
  void main() {
    vec3 p = normalize(vPosition) * 3.2;
    float flow = fbm(p + vec3(uTime * .055, -uTime * .035, uTime * .02));
    float detail = fbm(p * 2.4 - vec3(uTime * .08, 0.0, uTime * .04));
    float fissures = smoothstep(.49, .76, flow + detail * .34);
    vec3 deep = vec3(.055, .008, .16);
    vec3 violet = vec3(.33, .045, .82);
    vec3 plasma = vec3(.56, .12, .92);
    vec3 hot = vec3(.82, .42, 1.0);
    vec3 color = mix(deep, violet, flow);
    color = mix(color, plasma, detail * .72);
    color = mix(color, hot, fissures * .58);
    float fresnel = pow(1.0 - max(dot(vNormal, vec3(0,0,1)), 0.0), 2.2);
    color += vec3(.34, .06, .78) * fresnel * .82;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function KoraSpaceScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03020a, .028);
    const camera = new THREE.PerspectiveCamera(44, 1, .1, 100);
    camera.position.set(0, .25, 8.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .72;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .72, .52, .42);
    composer.addPass(bloom);

    const starMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uTime: { value: 0 } } });
    const star = new THREE.Mesh(new THREE.IcosahedronGeometry(1.78, 64), starMaterial);
    star.position.y = -1.38;
    star.rotation.z = -.15;
    scene.add(star);

    const coronaMaterial = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: `varying vec3 n; void main(){ n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 n; void main(){ float i=pow(.68-dot(n,vec3(0.,0.,1.)),3.2); gl_FragColor=vec4(.38,.08,.82,i*.42); }`,
    });
    const corona = new THREE.Mesh(new THREE.SphereGeometry(1.96, 96, 96), coronaMaterial);
    corona.position.y = -1.38;
    scene.add(corona);

    const halo = new THREE.PointLight(0x9b4dff, 6, 14, 1.7);
    halo.position.y = -1.38;
    scene.add(halo);
    scene.add(new THREE.AmbientLight(0x241448, 1.2));

    const starCount = 2200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 11 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      const tone = Math.random(); colors[i * 3] = .55 + tone * .45; colors[i * 3 + 1] = .55 + tone * .25; colors[i * 3 + 2] = 1;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const starField = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: .035, vertexColors: true, transparent: true, opacity: .8, sizeAttenuation: true }));
    scene.add(starField);

    const ships: { group: THREE.Group; speed: number; radius: number; phase: number; tilt: number }[] = [];
    const shipColors = [0xc4b5fd, 0x67e8f9, 0xffffff];
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(.075 + i * .012, .38, 5), new THREE.MeshStandardMaterial({ color: 0xdad7e6, metalness: .9, roughness: .22 }));
      body.rotation.z = -Math.PI / 2;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(.28, .025, .12), new THREE.MeshStandardMaterial({ color: 0x38256c, metalness: .75, roughness: .3 }));
      const engine = new THREE.PointLight(shipColors[i], 3, 1.4);
      engine.position.x = -.22;
      group.add(body, wing, engine);
      scene.add(group);
      ships.push({ group, speed: .08 + i * .025, radius: 4.1 + i * 1.1, phase: i * 2.15, tilt: -.35 + i * .3 });
    }

    const clock = new THREE.Clock();
    let frame = 0;
    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      composer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const animate = () => {
      const t = clock.getElapsedTime();
      starMaterial.uniforms.uTime.value = reduced ? 0 : t;
      if (!reduced) { star.rotation.y = t * .055; star.rotation.x = Math.sin(t * .08) * .08; corona.rotation.y = -t * .035; starField.rotation.y = t * .0025; }
      ships.forEach((ship) => {
        const a = ship.phase + (reduced ? 0 : t * ship.speed);
        ship.group.position.set(Math.cos(a) * ship.radius, Math.sin(a) * ship.radius * .34 + ship.tilt, Math.sin(a) * 1.8 - 1);
        ship.group.rotation.z = a + Math.PI / 2;
        const scale = .8 + ((ship.group.position.z + 3) / 6) * .45;
        ship.group.scale.setScalar(scale);
      });
      composer.render(); frame = requestAnimationFrame(animate);
    };
    resize(); animate(); window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener("resize", resize);
      mount.removeChild(renderer.domElement); composer.dispose(); renderer.dispose(); star.geometry.dispose(); starMaterial.dispose(); corona.geometry.dispose(); coronaMaterial.dispose(); starsGeometry.dispose();
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach((m) => m.dispose()); } });
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-label="Interactive three-dimensional violet star with spacecraft orbiting in deep space" role="img" />;
}
