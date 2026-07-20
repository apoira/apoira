# Mandate

Mandate is deterministic authorization infrastructure for agent-managed
portfolios.

The portfolio engine may research assets and propose trades. Mandate is the
smaller, independent system that decides whether an exact order is allowed to
touch capital.

```text
portfolio proposal + live state + policy
                    |
                    v
             Mandate kernel
              /           \
      denial receipt    order-bound permit
                              |
                              v
                       execution relay
```

## What is real today

This repository contains a working V1 authorization kernel:

- deterministic policy evaluation across the whole proposed portfolio
- eligibility, price freshness, liquidity, order-size, cash, gross-exposure,
  concentration, and sell-inventory checks
- content-addressed decision receipts for replay and audit
- short-lived permits bound to the exact account, asset, amount, price, and
  route
- a single-use permit ledger that rejects modified, expired, and replayed
  orders
- a zero-dependency CLI, fixtures, and automated tests
- the static product and architecture site in [`site/`](site/)

The research agents, live market adapters, custody, Robinhood MCP routing, and
Robinhood Chain settlement are **not built**. The included venue is a paper
fixture. No real account credentials or capital are used.

## Quickstart

Requires Node.js 20 or newer.

```bash
npm install
npm test
npm run demo
```

Evaluate your own proposal:

```bash
node src/cli.js evaluate \
  --policy examples/policy.json \
  --state examples/state.json \
  --intent examples/intent.json
```

The CLI prints a complete JSON decision receipt. It exits with code `0` for an
allowed intent and `2` for a denied intent.

## Trust boundary

The agent never receives a venue credential. It submits an intent. Mandate
evaluates that intent against independently supplied policy and state. An
execution relay should accept only a valid, unexpired, unconsumed permit and
must submit the exact order whose hash is embedded in that permit.

Changing the asset, side, quantity, price bound, account, or venue changes the
intent hash and invalidates the permit.

See [architecture](docs/architecture.md), [policy model](docs/policy.md), and
[receipt format](docs/receipts.md).

## Why separate it from the portfolio engine?

Research is probabilistic and changes frequently. Capital authority should be
small, deterministic, testable, and independently deployable. A better model
can improve proposals without silently expanding what the system is permitted
to execute.

## Next build boundary

1. Persist permits and receipts in an append-only store.
2. Add signed state snapshots and issuer/registry adapters.
3. Build a paper portfolio loop that consumes real read-only market data.
4. Integrate one credentialed relay only after the permit boundary is audited.

Mandate is independent and is not affiliated with Robinhood. Tokenized private
and real-world assets may be illiquid, restricted, or unavailable in a given
jurisdiction. This software is not investment advice.

## License

MIT
