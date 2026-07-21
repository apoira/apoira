#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { evaluate } from "./evaluate.js";
import { LIVE_CONFIRMATION, executeRobinhoodOrder } from "./live.js";
import { runPaperCycle } from "./paper.js";
import {
  DEFAULT_CALLBACK_PORT,
  closeRobinhood,
  connectRobinhood,
} from "./robinhood.js";
import { JsonlEventStore } from "./store.js";

function usage() {
  console.error(`Usage:
  murre evaluate --policy FILE --state FILE --intent FILE [--at ISO_TIMESTAMP]
  murre paper-cycle --policy FILE --state FILE --targets FILE --ledger FILE --account ID [--at ISO_TIMESTAMP]
  murre robinhood-auth [--oauth-store FILE] [--callback-port PORT]
  murre robinhood-tools [--oauth-store FILE] [--callback-port PORT]
  murre live-order --policy FILE --state FILE --intent FILE --ledger FILE --robinhood-account-number ACCOUNT --confirm ${LIVE_CONFIRMATION} [--oauth-store FILE] [--at ISO_TIMESTAMP]`);
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

function positiveInteger(value, fallback, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return parsed;
}

async function openRobinhood(options) {
  const callbackPort = positiveInteger(
    options["callback-port"],
    DEFAULT_CALLBACK_PORT,
    "callback-port",
  );
  const timeoutSeconds = positiveInteger(options["timeout-seconds"], 300, "timeout-seconds");
  return connectRobinhood({
    oauthStorePath: options["oauth-store"] || ".murre/robinhood-oauth.json",
    callbackPort,
    timeoutMs: timeoutSeconds * 1000,
    serverUrl: options["server-url"],
    onAuthorizationUrl: (url) => {
      console.error("Authorize Murre in a desktop browser, then return here:");
      console.error(url.toString());
    },
  });
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === "evaluate" && options.policy && options.state && options.intent) {
    const [policy, state, intent] = await Promise.all([
      readJson(options.policy),
      readJson(options.state),
      readJson(options.intent),
    ]);
    const receipt = evaluate({ policy, state, intent, at: options.at });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = receipt.decision === "ALLOW" ? 0 : 2;
  } else if (
    command === "paper-cycle"
    && options.policy
    && options.state
    && options.targets
    && options.ledger
    && options.account
  ) {
    const [policy, state, targetDocument] = await Promise.all([
      readJson(options.policy),
      readJson(options.state),
      readJson(options.targets),
    ]);
    const result = await runPaperCycle({
      policy,
      state,
      targets: targetDocument.weights || targetDocument,
      accountId: options.account,
      store: new JsonlEventStore(options.ledger),
      at: options.at,
      minTradeNotionalUsd: targetDocument.minTradeNotionalUsd || 100,
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.deniedOrders === 0 ? 0 : 2;
  } else if (command === "robinhood-auth" || command === "robinhood-tools") {
    const session = await openRobinhood(options);
    try {
      const { tools } = await session.client.listTools();
      if (command === "robinhood-tools") {
        console.log(JSON.stringify({ server: "robinhood-trading", tools }, null, 2));
      } else {
        console.log(JSON.stringify({
          connected: true,
          server: "robinhood-trading",
          tools: tools.map((tool) => tool.name),
        }, null, 2));
      }
    } finally {
      await closeRobinhood(session);
    }
  } else if (
    command === "live-order"
    && options.policy
    && options.state
    && options.intent
    && options.ledger
  ) {
    if (options.confirm !== LIVE_CONFIRMATION) {
      throw new Error(`Live execution requires --confirm ${LIVE_CONFIRMATION}`);
    }
    const accountNumber = options["robinhood-account-number"]
      || process.env.MURRE_ROBINHOOD_ACCOUNT_NUMBER;
    if (typeof accountNumber !== "string" || accountNumber.trim() === "") {
      throw new Error(
        "Live execution requires --robinhood-account-number or MURRE_ROBINHOOD_ACCOUNT_NUMBER",
      );
    }
    const [policy, state, intent] = await Promise.all([
      readJson(options.policy),
      readJson(options.state),
      readJson(options.intent),
    ]);
    const session = await openRobinhood(options);
    try {
    const result = await executeRobinhoodOrder({
        policy,
        state,
        intent,
        store: new JsonlEventStore(options.ledger),
        client: session.client,
        accountNumber,
        confirmation: options.confirm,
        at: options.at,
      });
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === "DENIED" ? 2 : 0;
    } finally {
      await closeRobinhood(session);
    }
  } else {
    usage();
    process.exitCode = 64;
  }
} catch (error) {
  console.error(`murre: ${error.message}`);
  process.exitCode = 1;
}
