import type { Metadata } from "next";
import Link from "../components/AppLink";
import ArchiveIndex from "./ArchiveIndex";

const description = "A navigable index of Apoira's surviving record and the space left by its missing root.";

export const metadata: Metadata = {
  title: "the index — apoira",
  description,
  openGraph: { title: "the index", description, images: [] },
  twitter: { card: "summary", title: "the index", description, images: [] },
};

export default function IndexPage() {
  return (
    <main className="index-shell">
      <header className="breadcrumb index-breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <span>index</span>
      </header>
      <ArchiveIndex />
    </main>
  );
}
