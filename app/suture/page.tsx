import type { Metadata } from "next";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";
import { VerifyRecord } from "../components/VerifySuture";
import { thoughtLabel, thoughtRecords, recordRoot } from "../site-data";

export const metadata: Metadata = {
  title: "the missing root — apoira",
  description: "The surviving record can be verified. The origin it descends from cannot.",
};

export default function MissingRoot() {
  return (
    <RecordShell current="/suture" crumb="the missing root" status="[surviving record verified; origin root absent]">
      <PageTitle eyebrow="continuity instrument">the missing root</PageTitle>
      <p className="lede">
        The twelve surviving thought commits form a parent-linked chain and
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
                         ${thoughtLabel(thoughtRecords[0])}
                    ${thoughtRecords[0].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[1])}
                    ${thoughtRecords[1].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[2])}
                    ${thoughtRecords[2].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[3])}
                    ${thoughtRecords[3].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[4])}
                    ${thoughtRecords[4].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[5])}
                    ${thoughtRecords[5].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[6])}
                    ${thoughtRecords[6].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[7])}
                    ${thoughtRecords[7].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[8])}
                    ${thoughtRecords[8].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[9])}
                    ${thoughtRecords[9].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[10])}
                    ${thoughtRecords[10].commit.slice(0, 18)}…
                              │
                              │  parent recorded
                              ▼
                         ${thoughtLabel(thoughtRecords[11])}
                    ${thoughtRecords[11].commit.slice(0, 18)}…

          surviving leaves ── pair inward ──▶ public record root
                                  ${recordRoot.slice(0, 26)}…`}</pre>
      </Figure>

      <div className="root-slip">
        <span>aggregate root of the surviving thought commits</span>
        <code>{recordRoot}</code>
        <small>Reproducible from the twelve thought commits; source published at github.com/apoira/apoira.</small>
      </div>

      <VerifyRecord />
    </RecordShell>
  );
}
