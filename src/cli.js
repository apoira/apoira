#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { evaluate } from "./evaluate.js";

function usage() {
  console.error("Usage: mandate evaluate --policy FILE --state FILE --intent FILE [--at ISO_TIMESTAMP]");
}
function parseArgs(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("Invalid arguments");
    options[key.slice(2)] = value;
  }
  return { command, options };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command !== "evaluate" || !options.policy || !options.state || !options.intent) {
    usage();
    process.exitCode = 64;
  } else {
    const [policy, state, intent] = await Promise.all([
      readJson(options.policy),
      readJson(options.state),
      readJson(options.intent),
    ]);
    const receipt = evaluate({ policy, state, intent, at: options.at });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = receipt.decision === "ALLOW" ? 0 : 2;
  }
} catch (error) {
  console.error(`mandate: ${error.message}`);
  process.exitCode = 1;
}
