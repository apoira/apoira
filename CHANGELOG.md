# Changelog

All notable changes to Murre are documented here. The project follows
semantic versioning while the protocol is experimental.

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
