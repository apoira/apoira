# Changelog

All notable changes to Murre are documented here. The project follows
semantic versioning while the protocol is experimental.

## 0.6.1 - 2026-07-22

### Added

- `murre_compare_equities`, a read-only MCP tool for comparing 2–5 public
  equities in one authenticated Robinhood session;
- complete per-symbol research objects, a compact comparison view, and a
  domain-separated hash over the combined evidence;
- explicit response fields confirming that comparison reads no account data
  and calls no order tools.

## 0.6.0 - 2026-07-21

### Added

- an opt-in `murre_live_order` MCP tool that routes bounded equity limit orders
  through Robinhood's official Trading MCP;
- explicit operator ceilings for per-order notional, total session notional,
  and order count;
- a ledger-persistent fresh-state gate that prevents another live attempt from
  reusing a state snapshot after permit consumption;
- mocked MCP protocol tests for allow, deny, session exhaustion, state reuse,
  and ambiguous placement failure.

### Security

- live MCP startup requires the literal `LIVE_ROBINHOOD_MCP` activation value,
  an existing OAuth store, and all three positive session ceilings;
- live mode fixes the account, venue, order type, time-in-force, policy, state,
  ledger, OAuth path, and ceilings outside the agent-callable schema;
- the required Robinhood Agentic account number is operator-supplied, bound into
  the remote argument hash, and redacted from agent responses and ledger bodies;
- paper mutation tools are unavailable while the server is live-armed;
- OAuth connection is lazy and noninteractive, so denied orders never connect
  to Robinhood and a server cannot pause for authorization mid-call.

## 0.5.0 - 2026-07-21

### Added

- a local stdio MCP server for agent tool discovery and calls;
- tools for portfolio status, exact-order checks, paper orders, target-weight
  rebalances, and verified recent audit events;
- replace-on-write paper state persistence and serialized MCP operations;
- an end-to-end test that launches the server through a real MCP client.

### Security

- the calling agent cannot choose the account, venue, policy, state, ledger,
  evaluation time, or credentials;
- the agent-facing MCP surface is paper-only and does not expose the guarded
  Robinhood live-order relay.

## 0.4.0 - 2026-07-20

### Added

- OAuth client registration and persistent token handling for Robinhood's
  official Streamable HTTP Trading MCP;
- runtime tool discovery for the remote Robinhood surface;
- a guarded single-order live relay using
  `review_equity_order -> permit consumption -> place_equity_order`;
- exact binding of Robinhood symbol, side, quantity, limit price, order type,
  and time-in-force arguments into the Murre intent hash;
- live failure-ordering, denial, replay, and tool-error tests.

### Security

- live routing requires the literal `LIVE_ROBINHOOD_ORDER` operator phrase;
- version 0.4 permits quantity-based equity limit orders only and rejects
  market orders, notional shortcuts, and unknown venue fields;
- OAuth material is stored outside source control under `.murre/` by default.

## 0.3.0 - 2026-07-20

### Changed

- renamed the project, package, CLI, site, and protocol namespace to Murre;
- moved protocol identifiers and local event storage into the `murre` namespace;
- refreshed product language around autonomous portfolios and governed execution.

## 0.2.0 - 2026-07-20

### Added

- durable hash-chained JSONL event storage;
- atomic single-use permit consumption with fail-closed locking;
- deterministic target-weight rebalance planning;
- end-to-end paper cycles with state updates and fill receipts;
- domain-separated protocol hashes;
- professional repository documentation, templates, and CI coverage.

## 0.1.0 - 2026-07-20

### Added

- deterministic policy evaluation;
- content-addressed decision receipts;
- short-lived exact-order permits;
- in-memory replay protection;
- static architecture website.
