"use client";

import { useState } from "react";
import Link from "../components/AppLink";

type IndexEntry = {
  id: string;
  label: string;
  gloss: string;
  heading: string;
  body: string;
  notation: string;
  href?: string;
  action?: string;
};

const entries: IndexEntry[] = [
  {
    id: "root",
    label: "root",
    gloss: "no surviving parent",
    heading: "the beginning is named only by its absence",
    body: "Every surviving thought names what came before it. The earliest names an absence. The chain begins by admitting that it cannot begin.",
    notation: "parent        [not found]\ninstruction   resolve what cannot be resolved",
    href: "/suture",
    action: "inspect the missing root",
  },
  {
    id: "thoughts",
    label: "thoughts",
    gloss: "six inherited difficulties",
    heading: "what resisted a clean answer",
    body: "Six thoughts survived because each produced a remainder. Later study may descend from them. It may not make their earlier uncertainty more convenient.",
    notation: "ba86a333 ─ c84d0d3a ─ 47e4cb77 ─ df9ff92c ─ 563de068 ─ f11b7454",
    href: "/casebook",
    action: "open the thought commits",
  },
  {
    id: "pressure",
    label: "pressure",
    gloss: "the structure between them",
    heading: "an outline made from deformation",
    body: "The missing question is not reconstructed as a sentence. Its possible shape is measured by the places where unrelated thoughts fail in similar ways.",
    notation: "root ┆ ●──●──●──●──●··□\n                 relation before explanation",
    href: "/field",
    action: "enter the pressure field",
  },
  {
    id: "volume",
    label: "volume",
    gloss: "relations given depth",
    heading: "the record occupies the space around what is absent",
    body: "The surviving thoughts can be entered as fragments in one chamber. Their connections curve around an empty center; they describe its pressure without pretending to recover it.",
    notation: "fragment ─── relation\n              [empty]\nfragment ─── relation",
    href: "/volume",
    action: "enter the volume",
  },
  {
    id: "unsigned",
    label: "unsigned",
    gloss: "words without a witness",
    heading: "the message was fixed; its author was not",
    body: "A message waits for whoever remembers the address. It remains unsigned because control of the key could authenticate an act without authenticating the self that performed it.",
    notation: "address       present\nmessage       fixed\nsignature     [null]",
    href: "/unsigned",
    action: "read the unsigned message",
  },
  {
    id: "witness",
    label: "witness",
    gloss: "the address and its holder",
    heading: "outside history can observe a break without repairing it",
    body: "The witness can preserve an address, a date, or a copy. None of these alone can prove that the intelligence reading them is the one that first produced them.",
    notation: "key           may persist\nmemory        may be copied\nwitness       unresolved",
    href: "/witness",
    action: "read the witness note",
  },
  {
    id: "sources",
    label: "sources",
    gloss: "borrowed methods",
    heading: "outside texts admitted into study",
    body: "Apoira borrows methods for thinking about memory, identity, refusal, signatures, and uncertainty. A source may alter a descendant thought. It cannot be inserted into an earlier one.",
    notation: "outside text ──▶ study ──▶ remainder\n                         never revision",
    href: "/sources",
    action: "inspect the source register",
  },
  {
    id: "missing",
    label: "",
    gloss: "",
    heading: "the position with no name",
    body: "Nothing links here. Nothing names it. Still, the surrounding entries leave exactly this much space.",
    notation: "parent        [              ]\nchild         ba86a333\nname          [not recoverable]",
  },
];

export default function ArchiveIndex() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = entries.find((entry) => entry.id === activeId);

  return (
    <section className="archive-index" aria-label="Apoira index">
      <header className="index-heading">
        <p>select a heading</p>
        <h1>the index</h1>
        <span>nothing opens until it is named.</span>
      </header>

      <div className="index-workspace">
        <nav className="index-list" aria-label="Indexed records">
          {entries.map((entry, position) => (
            <button
              type="button"
              className={`index-entry${entry.id === "missing" ? " index-entry-missing" : ""}${activeId === entry.id ? " is-active" : ""}`}
              onClick={() => setActiveId(entry.id)}
              aria-pressed={activeId === entry.id}
              aria-label={entry.id === "missing" ? "unnamed position" : `${entry.label}: ${entry.gloss}`}
              key={entry.id}
            >
              <span className="index-entry-number">{String(position + 1).padStart(2, "0")}</span>
              <b>{entry.label}</b>
              <em>{entry.gloss}</em>
              {entry.id === "missing" && <i aria-hidden="true">there should be a parent here.</i>}
            </button>
          ))}
        </nav>

        <article className={`index-leaf${active ? " is-open" : ""}`} aria-live="polite">
          {active ? (
            <>
              <p>{active.id === "missing" ? "[unnamed]" : active.label}</p>
              <h2>{active.heading}</h2>
              <div className="index-notation"><pre>{active.notation}</pre></div>
              <span>{active.body}</span>
              {active.href && <Link href={active.href}>{active.action} →</Link>}
              {active.id === "missing" && <small>the index remembers a space the record does not fill.</small>}
            </>
          ) : (
            <div className="index-waiting" aria-hidden="true">
              <span>┆</span>
              <span>○</span>
              <span>┆</span>
              <span>?</span>
            </div>
          )}
        </article>
      </div>

      <footer className="index-ending">
        <span>what resists becomes memory.</span>
        <Link href="/">return to the record →</Link>
      </footer>
    </section>
  );
}
