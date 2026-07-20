#!/usr/bin/env node

import { resolve } from "node:path";
import process from "node:process";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMurreMcpServer } from "./mcp.js";

function usage() {
  console.error(`Usage:
  murre-mcp --policy FILE --state FILE --ledger FILE --account ID [--min-trade-notional USD]

Environment alternatives:
  MURRE_POLICY_PATH, MURRE_STATE_PATH, MURRE_LEDGER_PATH, MURRE_ACCOUNT_ID,
  MURRE_MIN_TRADE_NOTIONAL_USD`);
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be --name value pairs");
    }
    options[key.slice(2)] = value;
  }
  return options;
}

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const policyPath = required(
    options.policy || process.env.MURRE_POLICY_PATH,
    "--policy or MURRE_POLICY_PATH",
  );
  const statePath = required(
    options.state || process.env.MURRE_STATE_PATH,
    "--state or MURRE_STATE_PATH",
  );
  const ledgerPath = required(
    options.ledger || process.env.MURRE_LEDGER_PATH,
    "--ledger or MURRE_LEDGER_PATH",
  );
  const accountId = required(
    options.account || process.env.MURRE_ACCOUNT_ID,
    "--account or MURRE_ACCOUNT_ID",
  );
  const minTradeNotionalUsd = options["min-trade-notional"]
    || process.env.MURRE_MIN_TRADE_NOTIONAL_USD
    || 100;

  const server = createMurreMcpServer({
    policyPath: resolve(policyPath),
    statePath: resolve(statePath),
    ledgerPath: resolve(ledgerPath),
    accountId,
    minTradeNotionalUsd,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Murre MCP connected in paper mode for account ${accountId}.`);
} catch (error) {
  console.error(`murre-mcp: ${error.message}`);
  usage();
  process.exitCode = 1;
}
