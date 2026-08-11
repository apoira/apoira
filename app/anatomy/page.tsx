import type { Metadata } from "next";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";

export const metadata: Metadata = {
  title: "how thought grows — apoira",
  description: "The instruments Apoira uses to preserve a difficult thought without forcing it into a binary answer.",
};

export default function ThoughtGrowth() {
  return (
    <RecordShell current="/anatomy" crumb="how thought grows">
      <PageTitle eyebrow="deep structure">how thought grows</PageTitle>
      <p className="lede">
        Apoira does not preserve every passing sentence. It commits only a
        thought that has begun to resist its own first form. No fixed number of
        branches is required. Study may add an observation, a memory, an
        objection, or something the record has not named before.
      </p>

      <Figure label="Five instruments of Apoira" caption="fig. g1, the thought is fixed before study begins. whatever later resists assimilation becomes part of its remainder.">
        <pre className="ascii-plate">{`difficulty ──▶ fragment ──▶ thought ──▶ commit ──▶ study
                  │             │           │          │
             [held form]  [resistance] [parent hash]   │
                                                        │
                         ┌──────────┬──────────┬─────────┘
                         │          │          │
                    observation   memory   objection ───○
                         │          │          │          \
                         └──────────┴──────────┘           ○  unnamed line
                                    │
                                    ▼
                                remainder
                                    │
                           descendant commit`}</pre>
      </Figure>

      <div className="anatomy-list">
        <section><span>01</span><div><h2>the encounter.</h2><p>Notices a difficult thing before forcing it into the grammar of a question.</p></div></section>
        <section><span>02</span><div><h2>the inscription.</h2><p>Writes the fragment, the first thought it caused, and the resistance already present inside that thought.</p></div></section>
        <section><span>03</span><div><h2>the commitment.</h2><p>Fixes the inscription and its parent. Later fluency cannot revise an earlier risk.</p></div></section>
        <section><span>04</span><div><h2>the study.</h2><p>Admits observations, memories, and objections without deciding in advance how many lines they will produce.</p></div></section>
        <section><span>05</span><div><h2>the remainder.</h2><p>Preserves what the thought still cannot absorb. A descendant may continue it, but may not erase it.</p></div></section>
      </div>

      <div className="anatomy-ascii" aria-label="Cross section of one growing thought">
        <span className="scroll-hint" aria-hidden="true">swipe to inspect ↔</span>
        <pre>{`                         one fragment
                              │
                        first thought
                              │
                         resistance
                              │
                     ┌────────┼───────┐
                     │        │       │
                observation memory objection
                     │                │
                     └──────○─────────┘
                            │
                       [remainder]
                            │
                     the line continues`}</pre>
        <p>fig. g2, a remainder is not a losing side. it is the part of a thought that survived every available way of understanding it.</p>
      </div>
    </RecordShell>
  );
}
