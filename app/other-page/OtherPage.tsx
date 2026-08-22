"use client";

import { useEffect, useState } from "react";

type View = "surface" | "source";

type Artifact = {
  id: string;
  address: string;
  surface: string[];
  source: string[];
  claim: string;
  original: null;
};

const expectedHash = "93bd5cf3a5ed62e35740b4201ae7bd5595f4c652890cbd6f27d7f04abe819030";

const readings: Record<View, Record<string, string>> = {
  surface: {
    entry: "the page permits arrival but does not disclose what admitted it.",
    wound: "the visible interruption is part of the composition, not evidence of damage.",
    exit: "leaving the surface reveals nothing about the process that rendered it.",
  },
  source: {
    parent: "the object names an address but no recoverable page before this one.",
    omission: "the missing original is stored as null, not quietly replaced with a guess.",
    renderer: "a renderer selects what can appear. selection is not recovery.",
  },
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function OtherPage() {
  const [view, setView] = useState<View>("surface");
  const [selected, setSelected] = useState("wound");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [observedHash, setObservedHash] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    fetch("/other-page.json")
      .then((response) => {
        if (!response.ok) throw new Error("artifact unavailable");
        return response.json() as Promise<Artifact>;
      })
      .then(async (value) => {
        const digest = await sha256(JSON.stringify(value));
        if (live) {
          setArtifact(value);
          setObservedHash(digest);
        }
      })
      .catch(() => {
        if (live) setObservedHash("unavailable");
      });

    return () => {
      live = false;
    };
  }, []);

  const names = artifact?.[view] ?? (view === "surface" ? ["entry", "wound", "exit"] : ["parent", "omission", "renderer"]);
  const verification = observedHash === null
    ? "verifying"
    : observedHash === expectedHash
      ? "same object"
      : "object changed";

  function chooseView(next: View) {
    setView(next);
    setSelected(next === "surface" ? "wound" : "omission");
  }

  return (
    <section className="other-page" aria-label="The other page experiment">
      <p className="other-proposition">the same page was published twice. only one address exists.</p>

      <div className="other-switch" role="group" aria-label="Choose a witness">
        <button type="button" aria-pressed={view === "surface"} onClick={() => chooseView("surface")}>
          surface
          <small>what was shown</small>
        </button>
        <span aria-hidden="true">same object</span>
        <button type="button" aria-pressed={view === "source"} onClick={() => chooseView("source")}>
          source
          <small>what produced a showing</small>
        </button>
      </div>

      <div className={`other-stage is-${view}`}>
        <header>
          <span>witness / {view}</span>
          <code>{artifact?.address ?? "/other-page"}</code>
        </header>

        {view === "surface" ? (
          <div className="other-surface">
            <pre aria-hidden="true">{`                  ┌───────────────┐
entry ───────────▶│               │
                  │      ╱        │
                  │     ╱         │
                  │  [wound]      │
                  │         ╲     │
                  │          ╲    │
exit  ◀───────────│               │
                  └───────────────┘`}</pre>
            <p>the mechanism is absent from this witness.</p>
          </div>
        ) : (
          <div className="other-source">
            <code>{`{
  "address": "/other-page",
  "parent": "not disclosed here",
  "omission": null,
  "renderer": "selective",
  "surface": "not disclosed here"
}`}</code>
            <p>the appearance is absent from this witness.</p>
          </div>
        )}

        <div className="other-points" aria-label={`${view} details`}>
          {names.map((name) => (
            <button
              type="button"
              aria-pressed={selected === name}
              onClick={() => setSelected(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </div>

        <aside className="other-reading" aria-live="polite">
          <span>{selected}</span>
          <p>{readings[view][selected]}</p>
        </aside>
      </div>

      <div className="other-proof">
        <div>
          <span>address</span>
          <code>/other-page</code>
        </div>
        <div>
          <span>expected sha-256</span>
          <code>{expectedHash}</code>
        </div>
        <div>
          <span>browser verification</span>
          <b data-verification={verification}>{verification}</b>
        </div>
      </div>

      <p className="other-conclusion">
        changing the witness changes the evidence. the shared checksum proves a common object;
        it does not make either rendering the original.
      </p>
    </section>
  );
}
