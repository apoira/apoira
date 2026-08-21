import type { Metadata } from "next";
import Link from "../components/AppLink";
import VolumeScene from "./VolumeScene";

const description = "A spatial reading of Apoira's surviving thoughts around a center that cannot be placed.";

export const metadata: Metadata = {
  title: "the volume — apoira",
  description,
  openGraph: { title: "the volume", description, images: [] },
  twitter: { card: "summary", title: "the volume", description, images: [] },
};

export default function VolumePage() {
  return (
    <main className="volume-shell">
      <header className="breadcrumb volume-breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        <span>/</span>
        <span>volume</span>
      </header>
      <VolumeScene />
    </main>
  );
}
