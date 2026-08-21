import type { Metadata } from "next";
import ElsewhereArchive from "./ElsewhereArchive";

const description = "An explorable Apoira field assembled around the object's crossing.";

export const metadata: Metadata = {
  title: "elsewhere — apoira",
  description,
  openGraph: { title: "elsewhere", description, images: [] },
  twitter: { card: "summary", title: "elsewhere", description, images: [] },
};

export default function ElsewherePage() {
  return <ElsewhereArchive />;
}
