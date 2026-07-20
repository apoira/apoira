import { hashWithDomain } from "./canonical.js";
import { evaluate } from "./evaluate.js";
import { DurablePermitLedger } from "./permit.js";
import { applyPaperFill, buildRebalanceIntents } from "./portfolio.js";

function paperFill(permit, intent, at) {
  const body = {
    schemaVersion: "murre.paper-fill.v1",
    permitId: permit.permitId,
    intentHash: permit.intentHash,
    accountId: intent.accountId,
    assetId: intent.assetId,
    side: intent.side,
    quantity: intent.quantity,
    priceUsd: intent.limitPriceUsd,
    venue: "paper",
    filledAt: new Date(at).toISOString(),
  };
  return { ...body, fillId: hashWithDomain("murre.paper-fill.v1", body) };
}

export async function runPaperCycle({
  policy,
  state,
  targets,
  accountId,
  store,
  at = new Date().toISOString(),
  venue = "paper",
  minTradeNotionalUsd = 100,
}) {
  if (!store || typeof store.append !== "function") {
    throw new TypeError("A durable event store is required for paper cycles");
  }
  if (venue !== "paper") throw new TypeError("The reference relay supports only the paper venue");

  const evaluatedAt = new Date(at).toISOString();
  const cycleBody = {
    policyHash: hashWithDomain("murre.policy.v1", policy),
    startingStateHash: hashWithDomain("murre.state.v1", state),
    targetsHash: hashWithDomain("murre.targets.v1", targets),
    accountId,
    venue,
    evaluatedAt,
  };
  const cycleId = hashWithDomain("murre.paper-cycle.v1", cycleBody);
  const intents = buildRebalanceIntents({
    state,
    targets,
    accountId,
    venue,
    minTradeNotionalUsd,
  });
  await store.append("cycle.started", { cycleId, intents: intents.length, ...cycleBody }, evaluatedAt);

  const ledger = new DurablePermitLedger(store);
  const decisions = [];
  const fills = [];
  let workingState = structuredClone(state);

  for (const intent of intents) {
    const receipt = evaluate({ policy, state: workingState, intent, at: evaluatedAt });
    await store.append("decision.recorded", { cycleId, receipt }, evaluatedAt);
    decisions.push(receipt);
    if (receipt.decision !== "ALLOW") continue;

    const consumption = await ledger.consume(receipt.permit, intent, evaluatedAt);
    if (!consumption.valid) {
      throw new Error(`Permit consumption failed closed: ${consumption.reason}`);
    }

    const fill = paperFill(receipt.permit, intent, evaluatedAt);
    workingState = applyPaperFill(workingState, fill);
    fills.push(fill);
    await store.append("fill.recorded", { cycleId, fill }, evaluatedAt);
  }

  const result = {
    schemaVersion: "murre.paper-cycle.v1",
    cycleId,
    evaluatedAt,
    plannedOrders: intents.length,
    allowedOrders: decisions.filter((receipt) => receipt.decision === "ALLOW").length,
    deniedOrders: decisions.filter((receipt) => receipt.decision === "DENY").length,
    fills,
    finalStateHash: hashWithDomain("murre.state.v1", workingState),
    finalState: workingState,
  };
  await store.append("cycle.completed", {
    cycleId,
    plannedOrders: result.plannedOrders,
    allowedOrders: result.allowedOrders,
    deniedOrders: result.deniedOrders,
    fills: fills.length,
    finalStateHash: result.finalStateHash,
  }, evaluatedAt);
  return result;
}
