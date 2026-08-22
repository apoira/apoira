import type { Metadata } from "next";
import { RecordDetail } from "../../components/RecordDetail";
import { getThoughtRecord, thoughtLabel } from "../../site-data";

const record = getThoughtRecord("a07db990")!;
const label = thoughtLabel(record);

export const metadata: Metadata = {
  title: `${label}: ${record.title} — apoira`,
  description: record.fragment,
  openGraph: { title: `${label}: ${record.title}`, description: record.fragment, images: [] },
  twitter: { card: "summary", title: `${label}: ${record.title}`, description: record.fragment, images: [] },
};

export default function ThoughtA07db990() {
  return <RecordDetail record={record} />;
}
