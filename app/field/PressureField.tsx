"use client";

import {
  type FormEvent,
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

type LocalTrace = {
  id: string;
  hash: string;
  targetId: string;
  x: number;
  y: number;
  response: string;
};

const STORAGE_KEY = "apoira.pressure-field.traces.v1";
const positions = [
  [390, 180],
  [625, 245],
  [410, 360],
  [650, 430],
  [485, 555],
] as const;

const pressureResponses: Record<string, string> = {
  ba86a333: "the question entered through authority. the instruction arrived before its author.",
  c84d0d3a: "the question entered through memory. two witnesses kept the same beginning.",
  "47e4cb77": "the question entered through refusal. the path not taken still changed the field.",
  df9ff92c: "the question entered through absence. what is missing continues to press against it.",
  "563de068": "the question entered through control. the key can answer before the witness.",
};

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
    x: 770,
    y: 555,
    label: "f3ad24d6",
    title: "the message that was not signed",
    kind: "artifact",
    fragment: "The words were fixed. The signature remained null.",
    remainder: "The key may return before the witness does.",
  },
];

const fixedEdges = [
  ["root:missing", "ba86a333"],
  ["ba86a333", "c84d0d3a"],
  ["c84d0d3a", "47e4cb77"],
  ["47e4cb77", "df9ff92c"],
  ["df9ff92c", "563de068"],
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

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function PressureField() {
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.86 });
  const [selectedId, setSelectedId] = useState("root:missing");
  const [question, setQuestion] = useState("");
  const [traces, setTraces] = useState<LocalTrace[]>([]);
  const [drifting, setDrifting] = useState(false);
  const dragPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.innerWidth < 680) setView({ x: 0, y: 0, scale: 0.56 });
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) setTraces(stored.slice(-7));
    } catch {
      // The public field still works when local storage is unavailable.
    }
  }, []);

  const nodeById = useMemo(() => new Map(fixedNodes.map((node) => [node.id, node])), []);
  const selectedFixed = nodeById.get(selectedId);
  const selectedTrace = traces.find((trace) => trace.id === selectedId);

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

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;

    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
    const hash = bytesToHex(digest);
    const target = fixedNodes[1 + (digest[0] % thoughtRecords.length)];
    const angle = (digest[1] / 255) * Math.PI * 2;
    const radius = 76 + (digest[2] % 76);
    const trace: LocalTrace = {
      id: `local-${hash.slice(0, 8)}`,
      hash,
      targetId: target.id,
      x: clamp(target.x + Math.cos(angle) * radius, 70, 930),
      y: clamp(target.y + Math.sin(angle) * radius, 80, 610),
      response: pressureResponses[target.id],
    };
    const next = [...traces.filter((item) => item.id !== trace.id), trace].slice(-7);
    setTraces(next);
    setSelectedId(trace.id);
    setQuestion("");
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A local trace may remain temporary.
    }
  }

  function clearTraces() {
    setTraces([]);
    setSelectedId("root:missing");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // There may be nothing durable to remove.
    }
  }

  return (
    <section className="pressure-field" aria-label="Interactive Apoira pressure field">
      <header className="field-heading">
        <div>
          <p>field instrument / 000</p>
          <h1>the pressure field</h1>
        </div>
        <p>five public thoughts · one unsigned artifact · {traces.length} local trace{traces.length === 1 ? "" : "s"}</p>
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

          {traces.map((trace) => {
            const target = nodeById.get(trace.targetId)!;
            return <i className="field-branch branch-local" style={branchStyle(target, trace)} key={`branch-${trace.id}`} />;
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

          {traces.map((trace) => (
            <button
              type="button"
              className={`field-node node-local${selectedId === trace.id ? " is-selected" : ""}`}
              style={{ left: trace.x, top: trace.y }}
              onClick={() => setSelectedId(trace.id)}
              aria-pressed={selectedId === trace.id}
              key={trace.id}
            >
              <span>{trace.hash.slice(0, 8)}</span>
              <b>local trace</b>
            </button>
          ))}
        </div>
      </div>

      <div className="field-lower">
        <aside className="field-inspector" aria-live="polite">
          <p>{selectedTrace ? "local / uncommitted" : selectedFixed?.kind ?? "field"}</p>
          <h2>{selectedTrace ? selectedTrace.hash.slice(0, 8) : selectedFixed?.title}</h2>
          <span>{selectedTrace ? selectedTrace.response : selectedFixed?.fragment}</span>
          <em>{selectedTrace ? `attached to ${selectedTrace.targetId}; the question itself was not stored.` : selectedFixed?.remainder}</em>
        </aside>

        <form className="field-probe" onSubmit={submitQuestion}>
          <label htmlFor="field-question">place one question under pressure</label>
          <div>
            <input
              id="field-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={180}
              autoComplete="off"
              placeholder="the field will not answer it"
            />
            <button type="submit">trace</button>
          </div>
          <p>sha-256 determines where the trace appears. no question leaves this browser; only its hash is retained locally.</p>
          {traces.length > 0 && <button className="field-clear" type="button" onClick={clearTraces}>clear local traces</button>}
        </form>
      </div>

      <footer className="field-ending">
        <span>the public record does not change when you touch it.</span>
        <a href="/unsigned">return to the unsigned message →</a>
      </footer>
    </section>
  );
}
