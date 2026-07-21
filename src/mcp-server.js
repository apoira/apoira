#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LIVE_MCP_ACTIVATION, createMurreMcpServer } from "./mcp.js";

function usage() {
  console.error(`Usage:
  murre-mcp --policy FILE --state FILE --ledger FILE --account ID [--min-trade-notional USD]

Opt-in live routing (moves real money):
  --live-routing ${LIVE_MCP_ACTIVATION}
  --robinhood-account-number ACCOUNT
  --oauth-store FILE
  --live-max-order-notional USD
  --live-max-session-notional USD
  --live-max-orders COUNT

Environment alternatives:
  MURRE_POLICY_PATH, MURRE_STATE_PATH, MURRE_LEDGER_PATH, MURRE_ACCOUNT_ID,
  MURRE_MIN_TRADE_NOTIONAL_USD, MURRE_LIVE_ROUTING, MURRE_ROBINHOOD_OAUTH_STORE,
  MURRE_ROBINHOOD_ACCOUNT_NUMBER,
  MURRE_LIVE_MAX_ORDER_NOTIONAL_USD, MURRE_LIVE_MAX_SESSION_NOTIONAL_USD,
  MURRE_LIVE_MAX_ORDERS`);
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
  const liveRouting = options["live-routing"] || process.env.MURRE_LIVE_ROUTING;
  const liveOptionsPresent = [
    liveRouting,
    options["oauth-store"],
    process.env.MURRE_ROBINHOOD_OAUTH_STORE,
    options["robinhood-account-number"],
    process.env.MURRE_ROBINHOOD_ACCOUNT_NUMBER,
    options["live-max-order-notional"],
    process.env.MURRE_LIVE_MAX_ORDER_NOTIONAL_USD,
    options["live-max-session-notional"],
    process.env.MURRE_LIVE_MAX_SESSION_NOTIONAL_USD,
    options["live-max-orders"],
    process.env.MURRE_LIVE_MAX_ORDERS,
  ].some((value) => value !== undefined);
  if (liveOptionsPresent && liveRouting !== LIVE_MCP_ACTIVATION) {
    throw new Error(`Live routing requires --live-routing ${LIVE_MCP_ACTIVATION}`);
  }
  const oauthStorePath = liveRouting === LIVE_MCP_ACTIVATION
    ? resolve(required(
      options["oauth-store"] || process.env.MURRE_ROBINHOOD_OAUTH_STORE,
      "--oauth-store or MURRE_ROBINHOOD_OAUTH_STORE",
    ))
    : null;
  if (oauthStorePath && !existsSync(oauthStorePath)) {
    throw new Error(
      `Robinhood OAuth store not found at ${oauthStorePath}; run murre robinhood-auth first`,
    );
  }
  const live = liveRouting === LIVE_MCP_ACTIVATION ? {
    enabled: true,
    accountNumber: required(
      options["robinhood-account-number"] || process.env.MURRE_ROBINHOOD_ACCOUNT_NUMBER,
      "--robinhood-account-number or MURRE_ROBINHOOD_ACCOUNT_NUMBER",
    ),
    oauthStorePath,
    maxOrderNotionalUsd: required(
      options["live-max-order-notional"] || process.env.MURRE_LIVE_MAX_ORDER_NOTIONAL_USD,
      "--live-max-order-notional or MURRE_LIVE_MAX_ORDER_NOTIONAL_USD",
    ),
    maxSessionNotionalUsd: required(
      options["live-max-session-notional"] || process.env.MURRE_LIVE_MAX_SESSION_NOTIONAL_USD,
      "--live-max-session-notional or MURRE_LIVE_MAX_SESSION_NOTIONAL_USD",
    ),
    maxOrders: required(
      options["live-max-orders"] || process.env.MURRE_LIVE_MAX_ORDERS,
      "--live-max-orders or MURRE_LIVE_MAX_ORDERS",
    ),
  } : { enabled: false };

  const server = createMurreMcpServer({
    policyPath: resolve(policyPath),
    statePath: resolve(statePath),
    ledgerPath: resolve(ledgerPath),
    accountId,
    minTradeNotionalUsd,
    live,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    live.enabled
      ? `Murre MCP connected with LIVE Robinhood routing for account ${accountId}.`
      : `Murre MCP connected in paper mode for account ${accountId}.`,
  );
} catch (error) {
  console.error(`murre-mcp: ${error.message}`);
  usage();
  process.exitCode = 1;
}
