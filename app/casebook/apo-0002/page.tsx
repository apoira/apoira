import type { Metadata } from "next";
import { RecordDetail } from "../../components/RecordDetail";
import { getThoughtRecord } from "../../site-data";

const record = getThoughtRecord("apo-0002")!;
export const metadata: Metadata = {
  title: `${record.id}: ${record.title} — apoira`,
  description: record.fragment,
  openGraph: { title: `${record.id}: ${record.title}`, description: record.fragment, images: [] },
  twitter: { card: "summary", title: `${record.id}: ${record.title}`, description: record.fragment, images: [] },
};
export default function Thought0002() { return <RecordDetail record={record} />; }
