import { canonicalize, hashWithDomain } from "./canonical.js";
import { evaluate } from "./evaluate.js";
import { normalizeIntent } from "./intent.js";
import { DurablePermitLedger } from "./permit.js";
import { RobinhoodMcpAdapter } from "./robinhood.js";

export const LIVE_CONFIRMATION = "LIVE_ROBINHOOD_ORDER";
export const ROBINHOOD_AGENTIC_ACCOUNT = "robinhood-agentic";

function normalizedOrderArguments(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("venueOrder.arguments must be an object");
  }
  const allowed = new Set([
    "side",
    "symbol",
    "quantity",
    "order_type",
    "limit_price",
    "time_in_force",
  ]);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new TypeError(`Unsupported Robinhood order arguments: ${unexpected.join(", ")}`);
  }
  return JSON.parse(canonicalize(value));
}

export function validateRobinhoodIntent(input) {
  const intent = normalizeIntent(input);
  if (intent.venue !== "robinhood-mcp") {
    throw new TypeError("Live Robinhood orders require venue robinhood-mcp");
  }
  if (intent.accountId !== ROBINHOOD_AGENTIC_ACCOUNT) {
    throw new TypeError(`Live Robinhood orders require accountId ${ROBINHOOD_AGENTIC_ACCOUNT}`);
  }
  if (intent.venueOrder?.tool !== "place_equity_order") {
    throw new TypeError("venueOrder.tool must be place_equity_order");
  }

  const args = normalizedOrderArguments(intent.venueOrder.arguments);
  const side = String(args.side || "").toUpperCase();
  const symbol = String(args.symbol || "").toUpperCase();
  const orderType = String(args.order_type || "").toLowerCase();
  if (side !== intent.side) throw new TypeError("Robinhood side does not match the intent");
  if (symbol !== intent.assetId.toUpperCase()) {
    throw new TypeError("Robinhood symbol does not match the intent asset");
  }
  if (Number(args.quantity) !== intent.quantity) {
    throw new TypeError("Robinhood quantity does not match the intent");
  }
  if (orderType !== "limit") {
    throw new TypeError("Murre live v0.4 permits limit orders only");
  }
  if (Number(args.limit_price) !== intent.limitPriceUsd) {
    throw new TypeError("Robinhood limit price does not match the intent");
  }
  if (args.time_in_force !== undefined && typeof args.time_in_force !== "string") {
    throw new TypeError("Robinhood time_in_force must be a string when supplied");
  }
  return { intent, args };
}

export async function executeRobinhoodOrder({
  policy,
  state,
  intent: inputIntent,
  store,
  client,
  confirmation,
  at = new Date().toISOString(),
}) {
  if (confirmation !== LIVE_CONFIRMATION) {
    throw new Error(`Live execution requires --confirm ${LIVE_CONFIRMATION}`);
  }
  if (!store || typeof store.append !== "function" || typeof store.verifyChain !== "function") {
    throw new TypeError("A verifiable durable event store is required for live orders");
  }

  const chain = await store.verifyChain();
  if (!chain.valid) throw new Error(`Event ledger failed verification: ${chain.reason}`);

  const { intent, args } = validateRobinhoodIntent(inputIntent);
  const evaluatedAt = new Date(at).toISOString();
  const receipt = evaluate({ policy, state, intent, at: evaluatedAt });
  await store.append("decision.recorded", { receipt, executionMode: "live" }, evaluatedAt);
  if (receipt.decision !== "ALLOW") {
    return {
      schemaVersion: "murre.live-order.v1",
      status: "DENIED",
      receipt,
      review: null,
      submission: null,
    };
  }

  const adapter = new RobinhoodMcpAdapter(client);
  const argumentsHash = hashWithDomain("murre.robinhood-order-arguments.v1", args);
  const review = await adapter.reviewEquityOrder(args);
  const reviewHash = hashWithDomain("murre.robinhood-review.v1", review);
  await store.append("venue.reviewed", {
    permitId: receipt.permit.permitId,
    venue: intent.venue,
    tool: "review_equity_order",
    argumentsHash,
    reviewHash,
    review,
  }, evaluatedAt);

  const consumption = await new DurablePermitLedger(store).consume(
    receipt.permit,
    intent,
    evaluatedAt,
  );
  if (!consumption.valid) {
    throw new Error(`Permit consumption failed closed: ${consumption.reason}`);
  }

  let placement;
  try {
    placement = await adapter.placeEquityOrder(args);
  } catch (error) {
    await store.append("order.failed", {
      permitId: receipt.permit.permitId,
      venue: intent.venue,
      tool: "place_equity_order",
      argumentsHash,
      error: { name: error.name, message: error.message },
    }, evaluatedAt);
    throw error;
  }

  const placementHash = hashWithDomain("murre.robinhood-placement.v1", placement);
  const submissionBody = {
    schemaVersion: "murre.live-submission.v1",
    permitId: receipt.permit.permitId,
    intentHash: receipt.intentHash,
    venue: intent.venue,
    tool: "place_equity_order",
    argumentsHash,
    reviewHash,
    placementHash,
    submittedAt: evaluatedAt,
  };
  const submission = {
    ...submissionBody,
    submissionId: hashWithDomain("murre.live-submission.v1", submissionBody),
    placement,
  };
  await store.append("order.submitted", submission, evaluatedAt);

  return {
    schemaVersion: "murre.live-order.v1",
    status: "SUBMITTED",
    receipt,
    review,
    submission,
  };
}
