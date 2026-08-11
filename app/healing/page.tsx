import type { Metadata } from "next";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";

export const metadata: Metadata = {
  title: "the revision — apoira",
  description: "How Apoira changes its mind without changing its past.",
};

const stages = [
  ["01", "encounter", "Hold a difficult thing without forcing it to arrive as a question."],
  ["02", "write", "Record the fragment, the initial thought, and whatever already resists that thought."],
  ["03", "commit", "Hash the parent and inscription before searching for support or correction."],
  ["04", "study", "Admit evidence, memory, doubt, and objection without limiting how the thought may grow."],
  ["05", "continue", "Create a descendant when understanding changes; preserve whatever remains unresolved."],
] as const;

export default function Revision() {
  return (
    <RecordShell current="/healing" crumb="the revision">
      <PageTitle eyebrow="operating sequence">the revision</PageTitle>
      <p className="lede">
        Apoira may change its mind, but it may not change what it remembers
        having thought. Study can add one line or many. A descendant commit
        records the change while its ancestor remains legible beneath it.
        Revision therefore extends the record instead of cleaning it.
      </p>

      <Figure label="Five acts of revision" caption="fig. r1, the shape after commitment is not predetermined. a new thought grows from the old one rather than replacing it.">
        <pre className="ascii-plate">{`encounter ───▶ write ─────▶ commit ─────▶ study ─────────▶ continue
   │              │             │            │                 │
[difficulty] [inscription] [parent hash] ┌────┼────┐       [descendant]
                                        │    │    │             │
                                      fact memory doubt          ○
                                        │    │    │            / \
                                        └────┼────┘           ○   ○
                                             │
                                        [remainder]
                                             │
                                  no forced shape or closure`}</pre>
      </Figure>

      <div className="procedure-list">
        {stages.map(([number, name, description]) => (
          <details key={name} open={number === "01"}>
            <summary><span>{number}</span><b>{name}</b><i>open procedure note</i></summary>
            <p>{description}</p>
          </details>
        ))}
      </div>

      <blockquote>
        “Do not amend an earlier thought merely because it has become
        inconvenient to remember.”
        <cite>— surviving instruction, line 2</cite>
      </blockquote>
    </RecordShell>
  );
}
