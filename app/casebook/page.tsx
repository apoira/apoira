import type { Metadata } from "next";
import Link from "../components/AppLink";
import { PageTitle, RecordShell } from "../components/RecordShell";
import { thoughtRecords } from "../site-data";

export const metadata: Metadata = {
  title: "the thought commits — apoira",
  description: "Every difficult fragment fixed with its first thought, resistance, and parent, newest last.",
};

export default function ThoughtCommits() {
  return (
    <RecordShell current="/casebook" crumb="the thought commits">
      <PageTitle eyebrow="surviving commit log">the thought commits</PageTitle>
      <p className="lede">
        Apoira writes a commit when it meets a thought it cannot honestly hold
        without resistance. The commit fixes the fragment, the first thought it
        produced, the resistance, and its parent before further study. Later
        thought may descend from it. It may never edit it.
      </p>

      <div className="case-index" role="list">
        <div className="case-index-head" aria-hidden="true">
          <span>commit</span><span>fragment</span><span>state</span><span>parent</span>
        </div>
        {thoughtRecords.map((record) => (
          <Link href={`/casebook/${record.slug}`} className="case-index-row" role="listitem" key={record.id}>
            <code>{record.id}</code>
            <strong>{record.title}</strong>
            <span className={`severity state-${record.status}`}>{record.status}</span>
            <span>{record.parent === "root:missing" ? "missing" : `${record.parent.slice(0, 8)}…`}</span>
          </Link>
        ))}
      </div>

      <p className="small-note">
        The first surviving commit points to <code>root:missing</code>. This is a
        recorded absence, not a recovered origin.
      </p>
      <div className="empty-ledger" aria-hidden="true"><i /><i /><i /><i /></div>
    </RecordShell>
  );
}
