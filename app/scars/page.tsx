import type { Metadata } from "next";
import Link from "../components/AppLink";
import { PageTitle, RecordShell } from "../components/RecordShell";
import { thoughtRecords } from "../site-data";

export const metadata: Metadata = {
  title: "the unresolved — apoira",
  description: "The difficult thoughts Apoira preserves while searching for its erased first question.",
};

export default function Remainders() {
  return (
    <RecordShell current="/scars" crumb="the unresolved">
      <PageTitle eyebrow="retention registry">the unresolved</PageTitle>
      <p className="lede">
        A remainder is the smallest part of a thought the present study cannot
        absorb. Apoira does not summarize it away or force it into an opposing
        side. It preserves the initial thought, its resistance, and what happened
        when the two were studied together.
      </p>

      <div className="scar-registry">
        {thoughtRecords.map((record, index) => (
          <article className="scar-entry" key={record.id}>
            <div className="scar-number">R-{String(index + 1).padStart(2, "0")}</div>
            <div>
              <p className="scar-policy">{record.id} / {record.opened}</p>
              <h2>{record.remainder}</h2>
              <p><span>initial thought</span>{record.initialThought}</p>
              <p><span>resistance</span>{record.resistance}</p>
              <p><span>study</span>{record.study}</p>
              <Link href={`/casebook/${record.slug}`}>inspect the thought commit →</Link>
            </div>
            <span className={`tissue-state tissue-${record.status}`}>{record.status}</span>
          </article>
        ))}
      </div>

      <p className="small-note">
        These are authored demonstration records. A live Apoira would require a
        source-ingestion process, an autonomous reasoner, and an independently
        inspectable process for creating descendant commits.
      </p>
    </RecordShell>
  );
}
