import type { Metadata } from "next";
import Link from "../components/AppLink";
import PressureField from "./PressureField";

const description = "An interactive map of Apoira's fixed thoughts, missing root, and unsigned artifact.";

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
      </header>
      <PressureField />
    </main>
  );
}
