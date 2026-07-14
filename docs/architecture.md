# Architecture

Mandate separates return-seeking software from capital authority.

## Intelligence plane

The portfolio engine sources eligible assets, forms views, constructs targets,
and proposes order intents. It may use agents or statistical models. It does
not possess venue credentials.

## Authority plane

The kernel receives three explicit inputs:

- an immutable policy document;
- a portfolio and asset-state snapshot;
- one exact order intent.

It normalizes and hashes those inputs, evaluates every configured constraint,
and emits a content-addressed decision receipt. Allowed intents also receive a
short-lived permit containing the exact intent hash.

## Execution plane

A future relay is the only component that should possess a venue credential.
Before routing, it must verify the permit, compare the submitted order hash,
atomically consume the permit, and return a fill receipt. The relay is not part
of V1.

## Failure model

Missing asset facts, unknown asset classes, stale valuations, invalid numeric
inputs, unavailable liquidity, and policy violations all fail closed. The
evaluator performs no network calls, so the same normalized inputs produce the
same checks and decision.
