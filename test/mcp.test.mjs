import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repository = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = join(repository, "src", "mcp-server.js");

function policy() {
  return {
    id: "mcp-test-policy",
    version: "1.0.0",
    allowedVenues: ["paper"],
    maxOrderNotionalUsd: 200,
    maxLimitPriceDeviationPct: 5,
    maxPositionPct: 100,
    maxGrossExposurePct: 100,
    minCashPct: 0,
    maxValuationAgeSeconds: { private_asset: 3600 },
    minAvailableLiquidityUsd: { private_asset: 100 },
    permitTtlSeconds: 60,
  };
}

function state(at) {
  return {
    schemaVersion: "murre.state.v1",
    accountId: "agent-paper-01",
    snapshotId: "mcp-start",
    capturedAt: at,
    portfolioValueUsd: 1_000,
    cashUsd: 1_000,
    positions: [],
    assets: {
      PRIVATE_AI: {
        assetClass: "private_asset",
        eligible: true,
        priceUsd: 20,
        valuedAt: at,
        availableLiquidityUsd: 10_000,
        venue: "paper",
      },
    },
  };
}

test("exposes a callable paper-safe MCP surface over stdio", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "murre-mcp-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const policyPath = join(directory, "policy.json");
  const statePath = join(directory, "state.json");
  const ledgerPath = join(directory, "events.jsonl");
  const at = new Date().toISOString();
  await Promise.all([
    writeFile(policyPath, JSON.stringify(policy()), "utf8"),
    writeFile(statePath, JSON.stringify(state(at)), "utf8"),
  ]);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      serverPath,
      "--policy", policyPath,
      "--state", statePath,
      "--ledger", ledgerPath,
      "--account", "agent-paper-01",
    ],
    cwd: repository,
    stderr: "pipe",
  });
  const client = new Client({ name: "murre-integration-test", version: "1.0.0" });
  context.after(() => transport.close());
  await client.connect(transport);

  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), [
    "murre_check_order",
    "murre_paper_order",
    "murre_rebalance",
    "murre_recent_events",
    "murre_status",
  ]);
  const paperTool = listed.tools.find((tool) => tool.name === "murre_paper_order");
  assert.deepEqual(Object.keys(paperTool.inputSchema.properties).sort(), [
    "assetId",
    "intentId",
    "limitPriceUsd",
    "quantity",
    "side",
  ]);
  assert.equal(paperTool.inputSchema.properties.accountId, undefined);
  assert.equal(paperTool.inputSchema.properties.venue, undefined);

  const status = await client.callTool({ name: "murre_status", arguments: {} });
  assert.equal(status.isError, undefined);
  assert.equal(status.structuredContent.mode, "paper");
  assert.equal(status.structuredContent.capabilities.liveOrders, false);
  assert.equal(status.structuredContent.state.assets[0].assetId, "PRIVATE_AI");

  const allowed = await client.callTool({
    name: "murre_paper_order",
    arguments: {
      intentId: "agent-order-1",
      assetId: "PRIVATE_AI",
      side: "BUY",
      quantity: 1,
      limitPriceUsd: 20,
    },
  });
  assert.equal(allowed.isError, undefined);
  assert.equal(allowed.structuredContent.status, "FILLED");

  const denied = await client.callTool({
    name: "murre_paper_order",
    arguments: {
      intentId: "agent-order-2",
      assetId: "PRIVATE_AI",
      side: "BUY",
      quantity: 20,
      limitPriceUsd: 20,
    },
  });
  assert.equal(denied.isError, undefined);
  assert.equal(denied.structuredContent.status, "DENIED");
  assert.equal(
    denied.structuredContent.receipt.checks.find((check) => check.id === "order.notional").pass,
    false,
  );

  const persisted = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(persisted.cashUsd, 980);
  assert.equal(persisted.positions[0].marketValueUsd, 20);

  const events = await client.callTool({
    name: "murre_recent_events",
    arguments: { limit: 10 },
  });
  assert.equal(events.structuredContent.ledger.valid, true);
  assert.equal(events.structuredContent.ledger.events, 4);
  assert.deepEqual(events.structuredContent.events.map((event) => event.type), [
    "decision.recorded",
    "permit.consumed",
    "fill.recorded",
    "decision.recorded",
  ]);
});
