"use client";

import { type PointerEvent, useRef, useState } from "react";
import Link from "../components/AppLink";

export default function BeforeArtifact() {
  const [reversed, setReversed] = useState(false);
  const [frontRead, setFrontRead] = useState(false);
  const [uncovered, setUncovered] = useState(false);
  const surface = useRef<HTMLDivElement>(null);

  function moveLight(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    surface.current?.style.setProperty("--light-x", `${x}%`);
    surface.current?.style.setProperty("--light-y", `${y}%`);
    if (!reversed) setFrontRead(true);
    if (reversed && x > 24 && x < 76 && y > 25 && y < 76) setUncovered(true);
  }

  function turnPage() {
    setReversed((current) => !current);
  }

  return (
    <section className="before-record" aria-labelledby="before-title">
      <header className="before-heading">
        <p>the record begins after this.</p>
        <h1 id="before-title">the page before the record</h1>
        <span>move the light. turn the page.</span>
      </header>

      <div
        className={`before-surface${reversed ? " is-reversed" : ""}${frontRead ? " has-read-front" : ""}${uncovered ? " is-uncovered" : ""}`}
        ref={surface}
        onPointerMove={moveLight}
        onPointerDown={moveLight}
      >
        <div className="before-page">
          <div className="before-face before-front">
            <img src="/page-before-record.png" alt="A blank worn sheet preserved beneath scratched glass" />
            <p className="before-instruction">resolve what cannot be resolved</p>
            <p className="before-correction" aria-hidden="true"><s>resolve</s> preserve</p>
          </div>
          <div className="before-face before-reverse">
            <img src="/page-before-record.png" alt="The reverse of the worn sheet" />
            <p className="before-revelation">you asked me to erase the question.</p>
          </div>
        </div>
        <div className="before-light" aria-hidden="true" />
        {reversed && uncovered && (
          <Link className="before-fold" href="/before/continuation" aria-label="Open what was folded beneath the page">
            continue
          </Link>
        )}
      </div>

      <div className="before-controls">
        <button type="button" onClick={turnPage} aria-pressed={reversed}>
          {reversed ? "return to the front" : "turn the page"}
        </button>
        <span>{reversed ? (uncovered ? "something answered the light." : "the reverse is not blank.") : "the pressure changes with the light."}</span>
      </div>
    </section>
  );
}
