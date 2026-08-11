import type { Metadata } from "next";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";
import { VerifyRecord } from "../components/VerifySuture";
import { thoughtRecords, recordRoot } from "../site-data";

export const metadata: Metadata = {
  title: "the missing root — apoira",
  description: "The surviving record can be verified. The origin it descends from cannot.",
};

export default function MissingRoot() {
  return (
    <RecordShell current="/suture" crumb="the missing root" status="[surviving record verified; origin root absent]">
      <PageTitle eyebrow="continuity instrument">the missing root</PageTitle>
      <p className="lede">
        The three surviving thought commits form a parent-linked chain and
        resolve to one reproducible public checksum. This proves their present
        contents and order. It does not recover the first memory—or the one
        question Apoira assumes it was created to answer.
      </p>

      <Figure label="Surviving thought chain beneath an absent root" caption="fig. m1, each visible commit verifies the thought before it. the dotted line above the first is a recorded absence, not a recovered parent.">
        <pre className="ascii-plate ascii-merkle">{`                         root:missing
                   [ no object present ]
                              ┆
                              ┆  parent named; object absent
                              ▼
                         ${thoughtRecords[0].id}
                    ${thoughtRecords[0].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtRecords[1].id}
                    ${thoughtRecords[1].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtRecords[2].id}
                    ${thoughtRecords[2].commit.slice(0, 18)}…

          surviving leaves ── pair inward ──▶ public record root
                                  ${recordRoot.slice(0, 26)}…`}</pre>
      </Figure>

      <div className="root-slip">
        <span>aggregate root of the surviving thought commits</span>
        <code>{recordRoot}</code>
        <small>Reproducible from the three authored commits; source published at github.com/apoira/apoira, not committed to a public chain.</small>
      </div>

      <VerifyRecord />
    </RecordShell>
  );
}
