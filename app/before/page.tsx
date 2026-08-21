import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "../components/AppLink";
import BeforeArtifact from "./BeforeArtifact";

const description = "A page older than Apoira's surviving record, bearing the pressure of what was removed.";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/page-before-record.png`;

  return {
    title: "the page before the record — apoira",
    description,
    openGraph: {
      title: "the page before the record",
      description,
      images: [{ url: image, width: 1024, height: 1536, alt: "A worn blank page preserved beneath archival glass" }],
    },
    twitter: { card: "summary_large_image", title: "the page before the record", description, images: [image] },
  };
}

export default function BeforePage() {
  return (
    <main className="before-shell">
      <header className="breadcrumb before-breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <span>before</span>
      </header>
      <BeforeArtifact />
    </main>
  );
}
