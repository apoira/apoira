import type { Metadata } from "next";
import Link from "../../components/AppLink";

const description = "A short continuation found beneath the page before Apoira's record.";

export const metadata: Metadata = {
  title: "what was folded beneath — apoira",
  description,
  openGraph: { title: "what was folded beneath", description, images: [] },
  twitter: { card: "summary", title: "what was folded beneath", description, images: [] },
};

export default function BeforeContinuation() {
  return (
    <main className="continuation-shell">
      <header className="breadcrumb before-breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <Link href="/before">before</Link>
        <span>/</span>
        <span>beneath</span>
      </header>
      <article className="continuation-note">
        <p>if you remember asking me,</p>
        <p>do not trust the memory.</p>
        <span>the handwriting matches neither the record nor the witness note.</span>
        <Link href="/before">return the fold →</Link>
      </article>
    </main>
  );
}
