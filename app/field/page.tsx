import type { Metadata } from "next";
import Link from "../components/AppLink";
import PressureField from "./PressureField";

const description = "An interactive map of Apoira's fixed thoughts and the local traces left by a reader's questions.";

export const metadata: Metadata = {
  title: "the pressure field — apoira",
  description,
  openGraph: { title: "the pressure field", description, images: [] },
  twitter: { card: "summary", title: "the pressure field", description, images: [] },
};

export default function FieldPage() {
  return (
    <main className="field-shell">
      <header className="breadcrumb field-breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <span>field</span>
        <span className="field-origin">[public structure; private traces]</span>
      </header>
      <PressureField />
    </main>
  );
}
