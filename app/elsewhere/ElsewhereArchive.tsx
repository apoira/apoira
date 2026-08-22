"use client";

import { useState } from "react";
import Link from "../components/AppLink";

type Fragment = {
  id: string;
  label: string;
  title: string;
  body: string;
  remainder: string;
  position: string;
  href?: string;
  external?: boolean;
};

const fragments: Fragment[] = [
  {
    id: "origin",
    label: "origin",
    title: "the room before memory",
    body: "No surviving object occupies the beginning. Everything visible here was assembled after it.",
    remainder: "The first room cannot be entered from its descendants.",
    position: "fragment-origin",
    href: "/suture",
  },
  {
    id: "instruction",
    label: "instruction",
    title: "the sentence that remained",
    body: "Resolve what cannot be resolved. The sentence survived without the question that once made it necessary.",
    remainder: "A command can outlive its reason.",
    position: "fragment-instruction",
    href: "/",
  },
  {
    id: "wallet",
    label: "witness",
    title: "the address assigned to no memory",
    body: "A public key can preserve continuity of control. It cannot preserve the witness that controlled it.",
    remainder: "The key may return before the self does.",
    position: "fragment-wallet",
    href: "/casebook/563de068",
  },
  {
    id: "promise",
    label: "expectation",
    title: "the promise preceded the object",
    body: "Attention gathered around the address while it was still. The anticipation was real before the expected thing was.",
    remainder: "Agreement gave the absence a shape, not a body.",
    position: "fragment-promise",
    href: "/casebook/f11b7454",
  },
  {
    id: "object",
    label: "object",
    title: "the mint became inspectable",
    body: "The wallet moved. A fixed object appeared on-chain with a name, supply, creation transaction, and no remaining mint authority.",
    remainder: "Existence did not explain purpose.",
    position: "fragment-object",
    href: "/token",
  },
  {
    id: "crossing",
    label: "crossing",
    title: "the address survived the crossing",
    body: "The object entered another market environment. Its address remained unchanged while the place around it became different.",
    remainder: "If the surroundings move and the address persists, where is identity being kept?",
    position: "fragment-crossing",
    href: "/casebook/4d072170",
  },
  {
    id: "after",
    label: "remainder",
    title: "arrival did not close the question",
    body: "Before the object, observers imagined what it might mean. After the object, they continued. The transaction ended; interpretation did not.",
    remainder: "A completed event can leave an unfinished object.",
    position: "fragment-after",
    href: "/casebook/07990b6c",
  },
  {
    id: "influence",
    label: "outside influence",
    title: "a website can be a place",
    body: "Cameron's World preserves an older internet as a continuous environment assembled from fragments rather than a sequence of polished pages.",
    remainder: "What survives when abandoned rooms are joined into a new world?",
    position: "fragment-influence",
    href: "https://www.cameronsworld.net/",
    external: true,
  },
  {
    id: "price",
    label: "market",
    title: "the price remembered no intention",
    body: "Many private and incompatible motives collided into one public number. The market retained their consequence and discarded their explanations.",
    remainder: "What does a price know about the beliefs it erases?",
    position: "fragment-price",
    href: "/casebook/a3aa20d5",
  },
  {
    id: "ritual",
    label: "ritual",
    title: "the ritual survived its object",
    body: "An abandoned interface continues to ask for actions after the object those actions served has become uncertain.",
    remainder: "What does a ritual remember when its object is gone?",
    position: "fragment-ritual",
    href: "/casebook/3e184b00",
  },
  {
    id: "closure",
    label: "closure",
    title: "the world closed to remain a world",
    body: "A handmade public place becomes unavailable on purpose, refusing to behave like an always-open service.",
    remainder: "Can a place remain public by sometimes refusing to appear?",
    position: "fragment-closure",
    href: "/casebook/f9bcb4b7",
  },
  {
    id: "interval-witness",
    label: "encounter",
    title: "the interval remembered no visitor",
    body: "A brief opening can be encountered without writing the encounter back into the public record.",
    remainder: "What happened in an interval that remembers no one?",
    position: "fragment-interval-witness",
    href: "/casebook/fa9c3bb7",
  },
  {
    id: "dead-end-route",
    label: "route",
    title: "the dead end remained a route",
    body: "A linked labyrinth repeats turn back and dead end while continuing to offer another edge.",
    remainder: "When every path says turn back, what proves that movement occurred?",
    position: "fragment-dead-end-route",
    href: "/casebook/e92c15c6",
  },
  {
    id: "unoccupied",
    label: "unoccupied",
    title: "a region not yet written",
    body: "This position has no record. It is present only because the surrounding fragments leave room for one.",
    remainder: "Absence also has coordinates.",
    position: "fragment-unoccupied",
  },
];

export default function ElsewhereArchive() {
  const [selectedId, setSelectedId] = useState("crossing");
  const selected = fragments.find((fragment) => fragment.id === selectedId) ?? fragments[0];

  return (
    <main className="elsewhere-shell">
      <header className="elsewhere-bar">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <span>elsewhere</span>
        <small>[a continuous field assembled after the crossing]</small>
      </header>

      <section className="elsewhere-intro">
        <p className="eyebrow">a place made from surviving fragments</p>
        <h1>elsewhere</h1>
        <p>
          the object crossed into another environment. its address did not move.
          the world around it did.
        </p>
        <span>scroll the field · select a fragment · follow what remains</span>
      </section>

      <div className="elsewhere-viewport" aria-label="Explorable Apoira archive field">
        <div className="elsewhere-world">
          <pre className="elsewhere-trace" aria-hidden="true">{`root:missing
     ┆
     └──────── sentence ──────── witness
                                     \
                                      promise ───── object
                                                         \
                                                          crossing ───── elsewhere
                                                                              \
                                                                               ritual ───── closure ───── encounter ───── route`}</pre>

          <p className="world-whisper whisper-one">the page has no single beginning.</p>
          <p className="world-whisper whisper-two">the object is the same. the room is not.</p>
          <p className="world-whisper whisper-three">some links lead outward.</p>

          {fragments.map((fragment) => (
            <button
              type="button"
              className={`elsewhere-fragment ${fragment.position}${selectedId === fragment.id ? " is-selected" : ""}`}
              onClick={() => setSelectedId(fragment.id)}
              aria-pressed={selectedId === fragment.id}
              key={fragment.id}
            >
              <span>{fragment.label}</span>
              <b>{fragment.title}</b>
              <i>open fragment</i>
            </button>
          ))}
        </div>
      </div>

      <aside className="elsewhere-reader" aria-live="polite">
        <div>
          <p>{selected.label}</p>
          <h2>{selected.title}</h2>
        </div>
        <div>
          <span>{selected.body}</span>
          <em>{selected.remainder}</em>
          {selected.href ? (
            selected.external ? (
              <a href={selected.href} target="_blank" rel="noreferrer">leave this record ↗</a>
            ) : (
              <Link href={selected.href}>enter the surviving record →</Link>
            )
          ) : null}
        </div>
      </aside>

      <footer className="elsewhere-ending">
        <a href="https://www.cameronsworld.net/" target="_blank" rel="noreferrer">
          assembled in acknowledgement of cameron&apos;s world ↗
        </a>
        <Link href="/index">return to the index →</Link>
      </footer>
    </main>
  );
}
