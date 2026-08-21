"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Link from "../components/AppLink";
import { thoughtRecords } from "../site-data";

type VolumeFragment = {
  id: string;
  label: string;
  title: string;
  fragment: string;
  remainder: string;
};

const labels = ["instruction", "copy", "refusal", "absence", "address", "expectation"];

const placements = [
  { position: [-3.0, 1.3, 0.25], rotation: [-0.18, 0.42, -0.08] },
  { position: [-0.75, 2.25, -1.15], rotation: [0.12, 0.1, 0.04] },
  { position: [2.1, 1.92, -0.38], rotation: [-0.14, -0.34, 0.1] },
  { position: [3.0, -0.4, 0.05], rotation: [0.08, -0.48, 0.06] },
  { position: [1.85, -2.02, -0.82], rotation: [0.2, -0.28, -0.09] },
  { position: [-0.8, -2.22, 0.18], rotation: [-0.2, 0.08, -0.03] },
  { position: [-3.0, -1.05, -0.68], rotation: [0.22, 0.36, 0.08] },
] as const;

function makePaperTexture(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#fffefa";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#d9d5cd";
  context.lineWidth = 2;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.fillStyle = "#6c322d";
  context.font = "30px Georgia, serif";
  context.fillText(label, 46, 72);
  context.strokeStyle = "#a9a49c";
  context.lineWidth = 2;
  for (const width of [510, 450, 485, 310]) {
    const line = 126 + [510, 450, 485, 310].indexOf(width) * 49;
    context.beginPath();
    context.moveTo(46, line);
    context.lineTo(46 + width, line);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function VolumeScene() {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const paperMeshesRef = useRef(new Map<string, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>>());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fragments = useMemo<VolumeFragment[]>(() => [
    ...thoughtRecords.map((record, index) => ({
      id: record.slug,
      label: labels[index],
      title: record.title,
      fragment: record.fragment,
      remainder: record.remainder,
    })),
    {
      id: "unsigned",
      label: "unsigned",
      title: "the message that was not signed",
      fragment: "If you are me, answer without the key.",
      remainder: "The key may return before the witness does.",
    },
  ], []);

  const selected = fragments.find((fragment) => fragment.id === selectedId) ?? null;

  useEffect(() => {
    for (const [id, mesh] of paperMeshesRef.current) {
      const active = id === selectedId;
      mesh.material.color.set(active ? "#f0e5df" : "#fffefa");
      mesh.material.emissive.set(active ? "#28100e" : "#000000");
      mesh.material.emissiveIntensity = active ? 0.035 : 0;
    }
  }, [selectedId]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    const paperMeshes = paperMeshesRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#fffefa");
    scene.fog = new THREE.Fog("#fffefa", 10, 22);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0.15, 0.45, 9.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "volume-canvas";
    renderer.domElement.setAttribute("aria-label", "Spatial arrangement of Apoira's surviving thought fragments");
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 5.1;
    controls.maxDistance = 13.5;
    controls.minPolarAngle = Math.PI * 0.24;
    controls.maxPolarAngle = Math.PI * 0.76;

    scene.add(new THREE.HemisphereLight("#fffefa", "#9a948c", 2.25));
    const keyLight = new THREE.DirectionalLight("#fffdf7", 2.8);
    keyLight.position.set(-3, 5, 7);
    scene.add(keyLight);

    const field = new THREE.Group();
    scene.add(field);

    const floor = new THREE.GridHelper(14, 28, "#d8d4cb", "#ece9e2");
    floor.position.y = -3.05;
    const floorMaterial = floor.material as THREE.Material;
    floorMaterial.transparent = true;
    floorMaterial.opacity = 0.42;
    field.add(floor);

    const papers: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[] = [];
    const resources: Array<THREE.Texture | THREE.Material | THREE.BufferGeometry> = [];

    fragments.forEach((fragment, index) => {
      const texture = makePaperTexture(fragment.label);
      const geometry = new THREE.PlaneGeometry(1.9, 1.18);
      const material = new THREE.MeshStandardMaterial({
        color: "#fffefa",
        map: texture,
        roughness: 0.96,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const paper = new THREE.Mesh(geometry, material);
      const placement = placements[index];
      paper.position.set(...placement.position);
      paper.rotation.set(...placement.rotation);
      paper.userData.fragmentId = fragment.id;
      field.add(paper);
      papers.push(paper);
      paperMeshes.set(fragment.id, paper);
      resources.push(geometry, material);
      if (texture) resources.push(texture);

      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: "#8e8980", transparent: true, opacity: 0.72 });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      paper.add(edges);
      resources.push(edgeGeometry, edgeMaterial);
    });

    const connectionMaterial = new THREE.LineBasicMaterial({ color: "#6f7880", transparent: true, opacity: 0.48 });
    resources.push(connectionMaterial);
    for (let index = 0; index < placements.length; index += 1) {
      const start = new THREE.Vector3(...placements[index].position);
      const end = new THREE.Vector3(...placements[(index + 1) % placements.length].position);
      const middle = start.clone().add(end).multiplyScalar(0.5);
      const direction = middle.clone().setY(middle.y * 0.78);
      if (direction.lengthSq() < 0.2) direction.set(0, index % 2 ? 1.55 : -1.55, -0.6);
      direction.normalize().multiplyScalar(2.05);
      middle.x = direction.x;
      middle.y = direction.y;
      middle.z -= 1.35;
      const curve = new THREE.CatmullRomCurve3([start, middle, end]);
      const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(42));
      field.add(new THREE.Line(curveGeometry, connectionMaterial));
      resources.push(curveGeometry);
    }

    const absenceGeometry = new THREE.RingGeometry(0.68, 0.7, 64, 1);
    const absenceMaterial = new THREE.MeshBasicMaterial({ color: "#bab5ad", transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const absence = new THREE.Mesh(absenceGeometry, absenceMaterial);
    absence.rotation.x = Math.PI / 2;
    absence.position.set(0, 0, -1.7);
    field.add(absence);
    resources.push(absenceGeometry, absenceMaterial);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7) {
        pointerStart = null;
        return;
      }
      pointerStart = null;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(papers, false)[0];
      setSelectedId(hit ? String(hit.object.userData.fragmentId) : null);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const animate = (time: number) => {
      frame = window.requestAnimationFrame(animate);
      if (!reduceMotion) {
        field.rotation.y = Math.sin(time * 0.000075) * 0.085;
        field.rotation.x = Math.cos(time * 0.00006) * 0.018;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      resources.forEach((resource) => resource.dispose());
      paperMeshes.clear();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [fragments]);

  return (
    <section className="volume-page" aria-label="the volume">
      <header className="volume-heading">
        <p>the record has depth but no center</p>
        <h1>the volume</h1>
        <span>Relations bend around what cannot be placed.</span>
      </header>

      <div className="volume-stage">
        <div className="volume-canvas-host" ref={canvasHostRef} />
        <p className="volume-instruction">drag to turn · scroll to approach · select a fragment</p>
        <nav className="volume-register" aria-label="Surviving fragments">
          {fragments.map((fragment) => (
            <button
              type="button"
              aria-pressed={selectedId === fragment.id}
              onClick={() => setSelectedId(fragment.id)}
              key={fragment.id}
            >
              {fragment.label}
            </button>
          ))}
        </nav>
        <article className={`volume-reading${selected ? " is-selected" : ""}`} aria-live="polite">
          {selected ? (
            <>
              <small>{selected.label}</small>
              <h2>{selected.title}</h2>
              <p>{selected.fragment}</p>
              <em>{selected.remainder}</em>
            </>
          ) : (
            <>
              <small>unoccupied</small>
              <h2>the center is absent</h2>
              <p>No fragment contains the first question. Its pressure appears only in the arrangement around it.</p>
            </>
          )}
        </article>
      </div>

      <footer className="volume-ending">
        <span>the chamber contains relations, not an answer.</span>
        <span><Link href="/field">flatten to the pressure field →</Link> · <Link href="/">return to the record →</Link></span>
      </footer>
    </section>
  );
}
