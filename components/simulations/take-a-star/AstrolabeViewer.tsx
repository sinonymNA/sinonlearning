"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function AstrolabeViewer({ angle, setAngle, aligned, cloud }: { angle: number; setAngle: (angle: number) => void; aligned: boolean; cloud: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(angle);
  useEffect(() => { angleRef.current = angle; }, [angle]);

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .05, 30); camera.position.set(0, 0, 5.7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffedc2, 0x241306, 2.6)); const key = new THREE.DirectionalLight(0xffdf9b, 4); key.position.set(-3, 4, 5); scene.add(key); const rim = new THREE.PointLight(0xffb743, 8, 10); rim.position.set(3, -2, 3); scene.add(rim);
    const root = new THREE.Group(); scene.add(root); let arm: THREE.Object3D | null = null;
    new GLTFLoader().load("/models/take-a-star/astrolabe-medieval-reconstruction.glb", (gltf) => {
      const model = gltf.scene; model.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3()); const scale = 3.45 / Math.max(size.x, size.y); model.scale.setScalar(scale); model.position.set(-center.x * scale, -center.y * scale, -center.z * scale); model.rotation.z = Math.PI; model.traverse((object) => { if (/arms/i.test(object.name)) arm = object; if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } }); root.add(model);
    });
    const resize = () => { renderer.setSize(mount.clientWidth, mount.clientHeight, false); camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1); camera.updateProjectionMatrix(); }; window.addEventListener("resize", resize); resize();
    let dragging = false; const adjust = (event: PointerEvent) => { if (!dragging) return; const rect = renderer.domElement.getBoundingClientRect(); const normalized = THREE.MathUtils.clamp((rect.bottom - event.clientY) / rect.height, 0, 1); setAngle(Number((65 + normalized * 23).toFixed(1))); };
    const down = (event: PointerEvent) => { dragging = true; renderer.domElement.setPointerCapture(event.pointerId); adjust(event); }; const move = (event: PointerEvent) => adjust(event); const up = () => dragging = false;
    renderer.domElement.addEventListener("pointerdown", down); renderer.domElement.addEventListener("pointermove", move); renderer.domElement.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointercancel", up);
    const clock = new THREE.Clock(); let frame = 0; const animate = () => { const t = clock.getElapsedTime(); root.rotation.y = Math.sin(t * .35) * .08; root.rotation.x = Math.sin(t * .52) * .035; if (arm) arm.rotation.z = THREE.MathUtils.degToRad(angleRef.current - 77); renderer.render(scene, camera); frame = requestAnimationFrame(animate); }; animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up); mount.removeChild(renderer.domElement); scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => material.dispose()); } }); renderer.dispose(); };
  }, [setAngle]);

  return <div className="relative h-full w-full"><div ref={mountRef} className={`h-full w-full cursor-ns-resize transition ${cloud ? "blur-sm opacity-55" : ""}`} aria-label="Interactive medieval astrolabe. Drag vertically to rotate the alidade." role="slider" aria-valuemin={65} aria-valuemax={88} aria-valuenow={angle} /><div className={`pointer-events-none absolute inset-x-0 bottom-5 mx-auto w-max rounded-full border px-4 py-2 text-xs font-bold backdrop-blur ${aligned ? "border-emerald-200/40 bg-emerald-300/20 text-emerald-100" : "border-white/15 bg-black/35 text-white/65"}`}>{aligned ? "Sunlight crosses both vanes" : "Drag vertically to rotate the alidade"}</div></div>;
}

