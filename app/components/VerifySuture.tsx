"use client";

import { useState } from "react";
import { thoughtRecords, recordRoot } from "../site-data";

function fromHex(hex: string) {
  return Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function pair(left: string, right: string) {
  const a = fromHex(left);
  const b = fromHex(right);
  const joined = new Uint8Array(a.length + b.length);
  joined.set(a, 0);
  joined.set(b, a.length);
  return toHex(await crypto.subtle.digest("SHA-256", joined));
}

async function merkleRoot(leaves: string[]) {
  let level = [...leaves];
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      next.push(await pair(level[index], level[index + 1] ?? level[index]));
    }
    level = next;
  }
  return level[0];
}

export function VerifyRecord() {
  const [state, setState] = useState<"idle" | "working" | "verified" | "failed">("idle");

  async function verify() {
    setState("working");
    try {
      const leaves = thoughtRecords.map((record) => record.commit);
      const root = await merkleRoot(leaves);
      setState(root === recordRoot ? "verified" : "failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="verify-box">
      <button type="button" onClick={verify} disabled={state === "working"}>
        {state === "working" ? "reconstructing the record…" : "verify the surviving root"}
      </button>
      <p aria-live="polite" className={`verify-state state-${state}`}>
        {state === "idle" && "the reader has not yet recomputed the surviving record."}
        {state === "working" && "pairing thought commits; moving inward."}
        {state === "verified" && "verified. all four thought commits resolve to the published surviving root."}
        {state === "failed" && "divergence found. the thought commits no longer resolve to the published root."}
      </p>
    </div>
  );
}
