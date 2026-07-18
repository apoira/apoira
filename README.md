<p align="center">
  <img src="site/assets/murre-profile.webp" alt="Murre bird and authorization gate" width="184">
</p>

# Murre

[![CI](https://github.com/moteMCP/murre/actions/workflows/ci.yml/badge.svg)](https://github.com/moteMCP/murre/actions/workflows/ci.yml)
[![Node.js 20.10+](https://img.shields.io/badge/node-%3E%3D20.10-417E38)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-111111)](LICENSE)

**Autonomous portfolios, governed by code.**

Murre turns a portfolio proposal, an independently supplied state snapshot,
and a versioned policy into one of two proof objects:

- a denial receipt explaining exactly which constraints failed; or
- a short-lived, single-use permit bound to the exact order.

The research system can change its models without expanding its authority.
Only the credentialed execution boundary may route an order, and only when the
order matches a valid permit.

> Murre is not an AI fund, broker, wallet, or trading venue. Version 0.3 is a
> paper-only reference implementation. It does not connect to live accounts or
> hold credentials.

## Why this exists

An autonomous portfolio system has two very different jobs:

1. **Seek returns.** Source assets, form views, construct targets, and propose
   trades. This work is probabilistic and changes often.
2. **Control capital.** Decide what may execute, under which facts and limits.
   This work should be small, deterministic, replayable, and independently
   deployable.

Murre is the second system.

```text
target weights ──> rebalance planner ──> order intents
                                             │
policy + signed state ───────────────> Murre kernel
                                             │
                         ┌───────────────────┴───────────────────┐
                         │                                       │
                    DENY receipt                       order-bound permit
                                                                 │
                                                        credentialed relay
                                                                 │
                                                          fill receipt
```

## What works

The repository contains executable infrastructure, not a simulated dashboard:

- deterministic checks for eligibility, venue support, valuation freshness,
  reference-price deviation, liquidity, order size, sell inventory,
  concentration, gross exposure, and minimum cash;
- domain-separated SHA-256 identifiers for policies, states, intents,
  decisions, permits, events, cycles, and fills;
- exact-order permits with expiry and replay protection;
- a durable JSONL event store with hash chaining and filesystem locking;
- atomic permit consumption that fails closed during lock contention;
- a target-weight planner that routes sells before buys;
- an end-to-end paper cycle that evaluates, consumes, fills, updates state, and
  records the complete timeline;
- a zero-runtime-dependency CLI and Node test suite.

## Quickstart

Murre requires Node.js 20.10 or newer.

```bash
git clone https://github.com/moteMCP/murre.git
cd murre
npm ci
npm test
```

Run a single policy evaluation:

```bash
npm run demo
```

Run a complete paper rebalance with a temporary durable ledger:

```bash
npm run demo:cycle
```

## CLI

Evaluate one intent:

```bash
node src/cli.js evaluate \
  --policy examples/policy.json \
  --state examples/state.json \
  --intent examples/intent.json
```

Run a paper cycle and retain its event chain:

```bash
node src/cli.js paper-cycle \
  --policy examples/policy.json \
  --state examples/state.json \
  --targets examples/targets.json \
  --ledger .murre/events.jsonl \
  --account paper-fund-01
```

The CLI exits `0` when all evaluated orders are allowed, `2` when policy denies
an order, `64` for invalid usage, and `1` for an operational error.

## Trust boundary

Agents receive no venue credential. They submit bounded intents containing an
account, asset, side, quantity, limit price, and venue. Changing any field
changes the intent hash and invalidates its permit.

The reference event store serializes permit consumption with an exclusive lock
and appends a hash-chained event before a paper fill is produced. A crash after
consumption but before fill therefore leaves the permit spent, which is the
safer failure mode.

## Repository map

```text
src/evaluate.js     decision receipt assembly
src/policy.js       deterministic portfolio constraints
src/permit.js       permit creation, verification, and consumption
src/store.js        durable hash-chained JSONL event store
src/portfolio.js    target-weight rebalance planning and state updates
src/paper.js        end-to-end paper execution cycle
src/cli.js          command-line interface
test/               boundary, replay, persistence, and cycle tests
site/               product and architecture website
```

## Security and production status

The current implementation is appropriate for local paper experiments and
protocol review. It is **not** ready to control real capital.

Before live use, Murre needs authenticated and signed state inputs, a durable
multi-host database, external key custody, an isolated relay, a formally
specified wire protocol, reconciliation against a real venue, operational
monitoring, and independent security review.

Robinhood Chain and Robinhood MCP are candidate integrations only. No adapter
or affiliation is claimed.

Read the [security model](SECURITY.md), [architecture](docs/architecture.md),
[policy model](docs/policy.md), [receipt format](docs/receipts.md), and
[paper-mode contract](docs/paper-mode.md).

## Development

```bash
npm ci
npm test
npm run demo
npm run demo:cycle
```

Changes to policy or authorization behavior must include allow, deny, and
boundary tests. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and disclaimer

MIT. Murre is experimental software, not investment advice. Tokenized
private and real-world assets may be restricted, illiquid, difficult to value,
or unavailable in a given jurisdiction.
