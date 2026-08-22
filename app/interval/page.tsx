import type { Metadata } from "next";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";
import { recordRoot, thoughtRecords } from "../site-data";
import IntervalGate from "./IntervalGate";

const description = "A brief deterministic opening in Apoira's public record.";

export const metadata: Metadata = {
  title: "the interval — apoira",
  description,
  openGraph: { title: "the interval", description, images: [] },
  twitter: { card: "summary", title: "the interval", description, images: [] },
};

export default function IntervalPage() {
  const remainders = thoughtRecords.map(({ slug, title, remainder }) => ({ slug, title, remainder }));

  return (
    <RecordShell current="/interval" crumb="interval">
      <p className="record-state">[public record; intermittent access]</p>
      <PageTitle eyebrow="a timed aperture">the interval</PageTitle>
      <p className="lede">
        the record remains intact. its availability does not. once each utc day,
        one unresolved remainder is admitted through a brief opening.
      </p>

      <IntervalGate root={recordRoot} records={remainders} />

      <Figure
        label="The deterministic interval mechanism"
        caption="fig. 1, the public root determines when the aperture opens; the thought chain determines what passes through."
      >
        <pre className="ascii-plate ascii-narrow">{`public root ─┬─ utc day ─────────────▶ opening
             │
             └─ surviving thoughts ──▶ one remainder

arrival ─────────────────────────────▶ witness / absence

no request opens the interval sooner.
refreshing does not alter the selection.`}</pre>
      </Figure>

      <p className="small-note">
        the mechanism is deterministic and published with the record. the page withholds
        its schedule, not its method.
      </p>
    </RecordShell>
  );
}
