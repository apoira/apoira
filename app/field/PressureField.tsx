"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { thoughtRecords } from "../site-data";

type FieldNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  title: string;
  kind: "root" | "commit" | "artifact";
  fragment: string;
  remainder: string;
};

const positions = [
  [390, 180],
  [625, 245],
  [410, 360],
  [650, 430],
  [485, 555],
  [650, 570],
  [820, 610],
  [690, 710],
  [500, 820],
  [260, 720],
  [175, 545],
  [275, 385],
  [95, 325],
] as const;

const fixedNodes: FieldNode[] = [
  {
    id: "root:missing",
    x: 500,
    y: 70,
    label: "root:missing",
    title: "the first question",
    kind: "root",
    fragment: "No recoverable object is present at the named origin.",
    remainder: "The descendants authenticate one another. Nothing authenticates the beginning.",
  },
  ...thoughtRecords.map((record, index) => ({
    id: record.slug,
    x: positions[index][0],
    y: positions[index][1],
    label: record.slug,
    title: record.title,
    kind: "commit" as const,
    fragment: record.fragment,
    remainder: record.remainder,
  })),
  {
    id: "unsigned",
    x: 850,
    y: 450,
    label: "f3ad24d6",
    title: "the message that was not signed",
    kind: "artifact",
    fragment: "The words were fixed. The signature remained null.",
    remainder: "The key may return before the witness does.",
  },
  {
    id: "token",
    x: 930,
    y: 545,
    label: "mint",
    title: "the object",
    kind: "artifact",
    fragment: "The public wallet created an inspectable Token-2022 mint.",
    remainder: "Existence is verified; meaning remains unresolved.",
  },
];

const fixedEdges = [
  ["root:missing", "ba86a333"],
  ["ba86a333", "c84d0d3a"],
  ["c84d0d3a", "47e4cb77"],
  ["47e4cb77", "df9ff92c"],
  ["df9ff92c", "563de068"],
  ["563de068", "f11b7454"],
  ["f11b7454", "07990b6c"],
  ["07990b6c", "4d072170"],
  ["4d072170", "a3aa20d5"],
  ["a3aa20d5", "3e184b00"],
  ["3e184b00", "f9bcb4b7"],
  ["f9bcb4b7", "fa9c3bb7"],
  ["fa9c3bb7", "e92c15c6"],
  ["07990b6c", "token"],
  ["563de068", "unsigned"],
] as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function branchStyle(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    left: from.x,
    top: from.y,
    width: Math.hypot(dx, dy),
    transform: `rotate(${Math.atan2(dy, dx)}rad)`,
  };
}

export default function PressureField() {
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.86 });
  const [selectedId, setSelectedId] = useState("root:missing");
  const [drifting, setDrifting] = useState(false);
  const dragPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.innerWidth < 680) setView({ x: 0, y: 0, scale: 0.56 });
  }, []);

  const nodeById = useMemo(() => new Map(fixedNodes.map((node) => [node.id, node])), []);
  const selectedFixed = nodeById.get(selectedId);

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPoint.current = { x: event.clientX, y: event.clientY };
  }

  function moveField(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragPoint.current) return;
    const dx = event.clientX - dragPoint.current.x;
    const dy = event.clientY - dragPoint.current.y;
    dragPoint.current = { x: event.clientX, y: event.clientY };
    setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  }

  function endDrag() {
    dragPoint.current = null;
  }

  function zoomField(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setView((current) => ({ ...current, scale: clamp(current.scale - event.deltaY * 0.001, 0.42, 1.45) }));
  }

  function changeZoom(amount: number) {
    setView((current) => ({ ...current, scale: clamp(current.scale + amount, 0.42, 1.45) }));
  }

  function centerField() {
    setView({ x: 0, y: 0, scale: window.innerWidth < 680 ? 0.56 : 0.86 });
  }

  return (
    <section className="pressure-field" aria-label="Interactive Apoira pressure field">
      <header className="field-heading">
        <h1>the pressure field</h1>
      </header>

      <div
        className="field-stage"
        onPointerDown={beginDrag}
        onPointerMove={moveField}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={zoomField}
      >
        <p className="field-instruction">drag = move · wheel = depth · select = inspect</p>
        <div className="field-tools" aria-label="Field controls">
          <button type="button" onClick={() => changeZoom(-0.12)} aria-label="Zoom out">−</button>
          <button type="button" onClick={centerField}>center</button>
          <button type="button" onClick={() => changeZoom(0.12)} aria-label="Zoom in">+</button>
          <button type="button" aria-pressed={drifting} onClick={() => setDrifting((current) => !current)}>
            drift {drifting ? "on" : "off"}
          </button>
        </div>

        <div
          className={`field-world${drifting ? " is-drifting" : ""}`}
          style={{ transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})` }}
        >
          {fixedEdges.map(([fromId, toId]) => {
            const from = nodeById.get(fromId)!;
            const to = nodeById.get(toId)!;
            return <i className={`field-branch branch-${from.kind}`} style={branchStyle(from, to)} key={`${fromId}-${toId}`} />;
          })}

          {fixedNodes.map((node) => (
            <button
              type="button"
              className={`field-node node-${node.kind}${selectedId === node.id ? " is-selected" : ""}`}
              style={{ left: node.x, top: node.y }}
              onClick={() => setSelectedId(node.id)}
              aria-pressed={selectedId === node.id}
              key={node.id}
            >
              <span>{node.label}</span>
              <b>{node.title}</b>
            </button>
          ))}

        </div>
      </div>

      <div className="field-lower">
        <aside className="field-inspector" aria-live="polite">
          <p>{selectedFixed?.kind ?? "field"}</p>
          <h2>{selectedFixed?.title}</h2>
          <span>{selectedFixed?.fragment}</span>
          <em>{selectedFixed?.remainder}</em>
        </aside>
      </div>

      <footer className="field-ending">
        <span>nothing here can be rewritten.</span>
        <a href="/unsigned">return to the unsigned message →</a>
      </footer>
    </section>
  );
}
