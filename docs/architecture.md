# Architecture

Mandate separates portfolio intelligence from capital authority. The codebase
contains six small components with explicit inputs and outputs.

## 1. Rebalance planner

`buildRebalanceIntents` converts target weights and the current portfolio into
minimal order intents. It validates target weights, uses prices supplied in the
state snapshot, ignores trades below the configured notional floor, and orders
sells before buys.

The planner has no execution authority. Its output is untrusted input to the
kernel.

## 2. Policy kernel

`evaluate` receives:

- one versioned policy document;
- one portfolio and asset-state snapshot;
- one normalized order intent;
- one explicit evaluation timestamp.

It performs no network calls. Every rule returns a stable identifier, observed
value, configured limit, pass/fail result, and reason. Missing facts fail
closed.

## 3. Decision receipt

The kernel emits a `mandate.decision.v1` receipt containing the complete check
vector and domain-separated hashes of the policy, state, and intent. A denied
receipt never contains a permit.

## 4. Permit boundary

Allowed decisions receive a `mandate.permit.v1` capability. The permit is bound
to the normalized intent hash, account, venue, policy, decision, issue time,
and expiry. Changing any execution field invalidates it.

## 5. Durable event store

`JsonlEventStore` serializes writes with an exclusive filesystem lock and
appends canonical JSON events. Each event includes its sequence, the previous
event hash, and its own domain-separated hash.

`DurablePermitLedger` checks the event history and appends `permit.consumed`
inside the same lock. A replay, expired permit, mismatched order, or busy ledger
fails closed.

This locking model is single-host only. Production needs an ACID datastore with
cross-host serialization.

## 6. Paper relay

`runPaperCycle` evaluates each planned order against the latest paper state,
records the decision, consumes its permit, creates a paper fill, and updates
cash and positions. A cycle produces a final state hash and a complete event
timeline.

The paper relay deliberately has no network adapter or credential.

## Failure ordering

The system records permit consumption before producing a fill. If the process
crashes between those steps, the permit remains spent. Recovery must reconcile
the event log before issuing a replacement. This favors duplicate-execution
prevention over automatic retry.
