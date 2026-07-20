import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { hashWithDomain } from "./canonical.js";
import { evaluate } from "./evaluate.js";
import { executePaperOrder, runPaperCycle } from "./paper.js";
import { JsonFileStateStore, readJsonFile } from "./state-store.js";
import { JsonlEventStore } from "./store.js";

const VERSION = "0.5.0";

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new TypeError(`${label} must be a positive number`);
  }
  return number;
}

function response(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function createSerializer() {
  let tail = Promise.resolve();
  return (operation) => {
    const result = tail.then(operation, operation);
    tail = result.catch(() => undefined);
    return result;
  };
}

function orderIntent(args, accountId) {
  return {
    id: args.intentId?.trim() || `mcp-${randomUUID()}`,
    accountId,
    assetId: args.assetId.trim(),
    side: args.side,
    quantity: args.quantity,
    limitPriceUsd: args.limitPriceUsd,
    venue: "paper",
  };
}

function assetSummary(state) {
  return Object.entries(state.assets || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([assetId, asset]) => ({
      assetId,
      assetClass: asset.assetClass || null,
      eligible: asset.eligible === true,
      priceUsd: asset.priceUsd ?? null,
      valuedAt: asset.valuedAt || null,
      availableLiquidityUsd: asset.availableLiquidityUsd ?? null,
      venues: Array.isArray(asset.venues)
        ? asset.venues
        : (asset.venue ? [asset.venue] : []),
    }));
}

export function createMurreMcpServer({
  policyPath,
  statePath,
  ledgerPath,
  accountId,
  minTradeNotionalUsd = 100,
  now = () => new Date().toISOString(),
}) {
  nonEmpty(policyPath, "policyPath");
  nonEmpty(statePath, "statePath");
  nonEmpty(ledgerPath, "ledgerPath");
  nonEmpty(accountId, "accountId");
  const minimumTrade = positiveNumber(minTradeNotionalUsd, "minTradeNotionalUsd");
  const stateStore = new JsonFileStateStore(statePath);
  const eventStore = new JsonlEventStore(ledgerPath);
  const serialize = createSerializer();

  async function inputs() {
    const [policy, state] = await Promise.all([
      readJsonFile(policyPath, "Policy file"),
      stateStore.read(),
    ]);
    if (state.accountId !== accountId) {
      throw new Error(
        `Configured account ${accountId} does not match state account ${state.accountId || "<missing>"}`,
      );
    }
    return { policy, state };
  }

  const server = new McpServer(
    { name: "murre", version: VERSION },
    {
      instructions: [
        "Murre is a paper-mode portfolio policy and execution boundary.",
        "Use murre_status before proposing an order.",
        "murre_check_order records a decision but never fills an order.",
        "murre_paper_order and murre_rebalance update only the configured local paper state.",
        "This server exposes no live Robinhood routing tool and no brokerage credentials.",
      ].join(" "),
    },
  );

  server.registerTool("murre_status", {
    title: "Murre status",
    description: "Read the configured paper portfolio, eligible asset facts, policy identity, and ledger health.",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, async () => serialize(async () => {
    const { policy, state } = await inputs();
    const chain = await eventStore.verifyChain();
    return response({
      schemaVersion: "murre.mcp-status.v1",
      mode: "paper",
      accountId,
      policy: {
        id: policy.id || null,
        version: policy.version || null,
        hash: hashWithDomain("murre.policy.v1", policy),
      },
      state: {
        snapshotId: state.snapshotId || null,
        hash: hashWithDomain("murre.state.v1", state),
        capturedAt: state.capturedAt || null,
        portfolioValueUsd: state.portfolioValueUsd ?? null,
        cashUsd: state.cashUsd ?? null,
        positions: state.positions || [],
        assets: assetSummary(state),
      },
      ledger: chain,
      capabilities: {
        policyChecks: true,
        paperOrders: true,
        paperRebalances: true,
        liveOrders: false,
      },
    });
  }));

  const orderSchema = {
    assetId: z.string().trim().min(1).max(128).describe("Asset identifier from murre_status."),
    side: z.enum(["BUY", "SELL"]),
    quantity: z.number().finite().positive(),
    limitPriceUsd: z.number().finite().positive(),
    intentId: z.string().trim().min(1).max(160).optional()
      .describe("Optional caller correlation ID. Murre generates one when omitted."),
  };

  server.registerTool("murre_check_order", {
    title: "Check a paper order",
    description: "Evaluate an exact order against the configured policy and current paper state. Records an audit receipt but never fills the order.",
    inputSchema: orderSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  }, async (args) => serialize(async () => {
    const { policy, state } = await inputs();
    const evaluatedAt = now();
    const intent = orderIntent(args, accountId);
    const receipt = evaluate({ policy, state, intent, at: evaluatedAt });
    await eventStore.append("decision.recorded", {
      source: "mcp",
      execution: "NOT_EXECUTED",
      receipt,
    }, evaluatedAt);
    return response({
      schemaVersion: "murre.mcp-check.v1",
      status: receipt.decision === "ALLOW" ? "ALLOWED" : "DENIED",
      execution: "NOT_EXECUTED",
      receipt,
    });
  }));

  server.registerTool("murre_paper_order", {
    title: "Execute a paper order",
    description: "Evaluate one exact order, consume its single-use permit when allowed, record a paper fill, and persist the resulting local paper state.",
    inputSchema: orderSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  }, async (args) => serialize(async () => {
    const { policy, state } = await inputs();
    const result = await executePaperOrder({
      policy,
      state,
      intent: orderIntent(args, accountId),
      store: eventStore,
      at: now(),
    });
    if (result.status === "FILLED") await stateStore.write(result.finalState);
    return response(result);
  }));

  server.registerTool("murre_rebalance", {
    title: "Run a paper rebalance",
    description: "Turn target portfolio weights into minimal paper orders, policy-check every order, fill only allowed orders, and persist the resulting paper state.",
    inputSchema: {
      targets: z.record(
        z.string().trim().min(1).max(128),
        z.number().finite().min(0).max(1),
      ).describe("Asset IDs mapped to target portfolio weights from 0 to 1."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  }, async ({ targets }) => serialize(async () => {
    const { policy, state } = await inputs();
    const result = await runPaperCycle({
      policy,
      state,
      targets,
      accountId,
      store: eventStore,
      at: now(),
      minTradeNotionalUsd: minimumTrade,
    });
    if (result.fills.length > 0) await stateStore.write(result.finalState);
    return response(result);
  }));

  server.registerTool("murre_recent_events", {
    title: "Read Murre audit events",
    description: "Read the newest records from the configured hash-chained Murre audit ledger.",
    inputSchema: {
      limit: z.number().int().min(1).max(200).default(25),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, async ({ limit }) => serialize(async () => {
    const verification = await eventStore.verifyChain();
    if (!verification.valid) {
      throw new Error(`Audit ledger failed verification: ${verification.reason}`);
    }
    const events = await eventStore.readAll();
    return response({
      schemaVersion: "murre.mcp-events.v1",
      ledger: verification,
      events: events.slice(-limit),
    });
  }));

  return server;
}
