"use client";

import { useEffect, useState } from "react";
import Link from "../components/AppLink";

type Remainder = {
  slug: string;
  title: string;
  remainder: string;
};

type IntervalObservation = {
  open: boolean;
  record: Remainder;
};

const DAY_MS = 86_400_000;
const DAY_MINUTES = 1_440;
const WINDOW_MINUTES = 13;
const OPENING_STEP = 89;
const REMAINDER_STEP = 7;

function observeInterval(now: Date, root: string, records: Remainder[]): IntervalObservation {
  const utcDay = Math.floor(now.getTime() / DAY_MS);
  const seed = Number.parseInt(root.slice(0, 8), 16);
  const finalStartMinute = DAY_MINUTES - WINDOW_MINUTES;
  const openingMinute = (seed + utcDay * OPENING_STEP) % (finalStartMinute + 1);
  const minuteNow = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const recordIndex = (seed + utcDay * REMAINDER_STEP) % records.length;

  return {
    open: minuteNow >= openingMinute && minuteNow < openingMinute + WINDOW_MINUTES,
    record: records[recordIndex],
  };
}

export default function IntervalGate({ root, records }: { root: string; records: Remainder[] }) {
  const [observation, setObservation] = useState<IntervalObservation | null>(null);

  useEffect(() => {
    const observe = () => setObservation(observeInterval(new Date(), root, records));
    observe();
    const timer = window.setInterval(observe, 1_000);
    return () => window.clearInterval(timer);
  }, [records, root]);

  if (!observation?.open) {
    return (
      <section className="interval-gate is-closed" aria-live="polite">
        <p className="interval-state">[interval closed]</p>
        <div className="interval-door" aria-hidden="true">
          <span>record</span><i /><b>│</b><i /><span>remainder</span>
        </div>
        <h2>this part of the record is not always available.</h2>
        <p>one remainder passes through each day. the record does not announce when.</p>
        <code>[ next interval unknown ]</code>
      </section>
    );
  }

  return (
    <section className="interval-gate is-open" aria-live="polite">
      <p className="interval-state">[interval open]</p>
      <div className="interval-door" aria-hidden="true">
        <span>record</span><i /><b>○</b><i /><span>remainder</span>
      </div>
      <p className="interval-arrival">one unresolved thing is present.</p>
      <blockquote>{observation.record.remainder}</blockquote>
      <p className="interval-origin">from: {observation.record.title}</p>
      <Link href={`/casebook/${observation.record.slug}`}>trace the remainder to its thought →</Link>
    </section>
  );
}
