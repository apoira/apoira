import Link from "./AppLink";
import type { ThoughtRecord } from "../site-data";
import { Figure, PageTitle, RecordShell } from "./RecordShell";

export function RecordDetail({ record }: { record: ThoughtRecord }) {
  return (
    <RecordShell current="/casebook" crumb={`${record.id} / ${record.title}`}>
      <PageTitle eyebrow={`thought commit ${record.id}`}>{record.title}</PageTitle>

      <div className="clinical-card">
        <span>parent</span><b>{record.parent === "root:missing" ? record.parent : `${record.parent.slice(0, 16)}…`}</b>
        <span>commit</span><b>{record.commit.slice(0, 16)}…</b>
        <span>opened</span><b>{record.opened}</b>
        <span>state</span><b>{record.status}</b>
      </div>

      <section className="prose-section">
        <h2>fragment.</h2>
        <p>{record.fragment}</p>
      </section>

      <Figure label={`Thought commit for ${record.title}`} caption="fig. c1, the fragment, its first thought, and its resistance are fixed before study. later change must appear as a descendant commit.">
        <pre className="ascii-plate ascii-case">{`                            ${record.id}
                                │
                             fragment
                                │
                         initial thought
                                │
                           resistance
                                │
                           [committed]
                                │
                           study / doubt
                         /      │      \
                  observation  memory  objection
                         \      │      /
                            remainder
                                │
                    [${record.status.padEnd(9, " ")}]`}</pre>
      </Figure>

      <section className="prose-section split-prose">
        <div>
          <h2>initial thought.</h2>
          <p>{record.initialThought}</p>
        </div>
        <div>
          <h2>resistance.</h2>
          <p>{record.resistance}</p>
        </div>
      </section>

      <div className="code-tissue" aria-label="Prior commitment discipline">
        <span>THOUGHT COMMIT {record.commit.slice(0, 16)}…</span>
        <code>PARENT {record.parent}</code>
        <code>FIX fragment + initial_thought + resistance</code>
        <code>COMMIT sha256(canonical_json[id,parent,fragment,initial_thought,resistance])</code>
        <code>THEN study // never before</code>
      </div>

      <section className="prose-section">
        <h2>study after commitment.</h2>
        <p>{record.study}</p>
      </section>

      <section className="prose-section">
        <h2>remainder.</h2>
        <p>{record.remainder}</p>
      </section>

      <div className="hash-slip">
        <span>thought commit sha-256</span>
        <code>{record.commit}</code>
      </div>

      <nav className="record-turn" aria-label="Thought commit navigation">
        <Link href="/casebook">← return to the thought commits</Link>
        <Link href="/suture">inspect the missing root →</Link>
      </nav>
    </RecordShell>
  );
}
