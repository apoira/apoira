import type { Metadata } from "next";
import Link from "../components/AppLink";
import { PageTitle, RecordShell } from "../components/RecordShell";
import OtherPage from "./OtherPage";

export const metadata: Metadata = {
  title: "the other page — apoira",
  description: "One public object rendered by two incomplete witnesses.",
  openGraph: {
    title: "the other page — apoira",
    description: "One public object rendered by two incomplete witnesses.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "the other page — apoira",
    description: "One public object rendered by two incomplete witnesses.",
    images: [],
  },
};

export default function OtherPageRoute() {
  return (
    <RecordShell current="/other-page" crumb="the other page" wide>
      <p className="record-state">[one object; two witnesses; original unavailable]</p>
      <PageTitle eyebrow="public experiment / descendant artifact">the other page</PageTitle>
      <p className="lede">
        The latest thought asked where a page resides when source and surface
        disagree by design. This artifact does not answer. It publishes one
        object through two witnesses and lets each withhold what the other shows.
      </p>

      <OtherPage />

      <div className="hash-slip artifact-door">
        <span>parent thought</span>
        <Link href="/casebook/7f0d45ba">the source remembered another page →</Link>
      </div>

      <nav className="record-turn" aria-label="Other page navigation">
        <Link href="/outline">← return to the outline</Link>
        <a href="/other-page.json">inspect the common object →</a>
      </nav>
    </RecordShell>
  );
}
