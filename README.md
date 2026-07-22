# Murre

[![CI](https://github.com/murreMCP/murre/actions/workflows/ci.yml/badge.svg)](https://github.com/murreMCP/murre/actions/workflows/ci.yml)
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

> Murre is not an AI fund, broker, wallet, or trading venue. Version 0.6 adds an
> opt-in live MCP tool for bounded equity limit orders through Robinhood's
> official Trading MCP. Paper mode remains the default. Live mode can move real
> money and is not approved for unattended or material capital.

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
- a stdio MCP server agents can call for status, policy checks, paper orders,
  paper rebalances, and verified audit events;
- an operator-armed live MCP mode whose agent-callable schema excludes the
  account, venue, credentials, policy, state, ledger, clock, and risk ceilings;
- OAuth and runtime tool discovery for Robinhood's official Trading MCP;
- a narrow live path that reviews an equity limit order, consumes the exact
  permit, submits the same arguments, and records a content-addressed receipt;
- a Node CLI and boundary-focused test suite.

## Quickstart

Murre requires Node.js 20.10 or newer.

```bash
git clone https://github.com/murreMCP/murre.git
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

Connect an agent to Murre's local paper-mode MCP server:

```bash
node src/mcp-server.js \
  --policy examples/policy.json \
  --state .murre/paper-state.json \
  --ledger .murre/mcp-events.jsonl \
  --account paper-fund-01
```

Copy `examples/state.json` to `.murre/paper-state.json` first; the MCP paper
tools persist fills to that file. See [the MCP server guide](docs/mcp-server.md)
for client configuration and the exact trust boundary.

Exercise the guarded Robinhood order path against an in-process paper MCP
client. This invokes the production policy, permit, adapter, and event-ledger
code without credentials, a brokerage request, or capital:

```bash
npm run demo:robinhood
```

Connect a dedicated Robinhood Agentic account without placing an order:

```bash
node src/cli.js robinhood-auth \
  --oauth-store .murre/robinhood-oauth.json
```

See [the guarded Robinhood MCP relay](docs/robinhood-mcp.md) before enabling
the live command.

Start an agent-callable live server only after OAuth onboarding and after
creating a policy and fresh state snapshot for the dedicated Agentic account:

```bash
node src/mcp-server.js \
  --policy .murre/live-policy.json \
  --state .murre/live-state.json \
  --ledger .murre/live-events.jsonl \
  --account robinhood-agentic \
  --live-routing LIVE_ROBINHOOD_MCP \
  --robinhood-account-number "$MURRE_ROBINHOOD_ACCOUNT_NUMBER" \
  --oauth-store .murre/robinhood-oauth.json \
  --live-max-order-notional 25 \
  --live-max-session-notional 75 \
  --live-max-orders 3
```

This intentionally gives the connected agent authority to submit orders up to
the configured ceilings without a new human confirmation for every call. The
agent receives only `murre_status`, `murre_recent_events`, and
`murre_live_order`; paper mutation tools are removed while live mode is armed.

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

Discover the authenticated Robinhood tool schemas:

```bash
node src/cli.js robinhood-tools \
  --oauth-store .murre/robinhood-oauth.json
```

The `live-order` command handles exactly one limit order and requires the
literal `LIVE_ROBINHOOD_ORDER` confirmation phrase plus an operator-supplied
Agentic account number. Its complete input contract and failure ordering are
documented in [docs/robinhood-mcp.md](docs/robinhood-mcp.md).

## Trust boundary

Agents receive no venue credential. In paper mode they submit bounded intents.
In live MCP mode they submit only symbol, side, quantity, limit price, and an
optional intent ID; the operator fixes every authority-bearing input when the
server starts. Changing any execution field changes the intent hash and
invalidates its permit.

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
src/state-store.js  replace-on-write local paper state
src/mcp.js          agent-facing paper and operator-armed live MCP tools
src/mcp-server.js   stdio MCP entrypoint
src/robinhood.js    official MCP transport, OAuth, and venue calls
src/live.js         guarded review, consume, and submit sequence
src/live-session.js live session ceilings and fresh-state replay gate
src/cli.js          command-line interface
test/               boundary, replay, persistence, and cycle tests
site/               product and architecture website
```

## Security and production status

The paper implementation is appropriate for local experiments and protocol
review. The 0.6 live MCP mode is an integration prototype that can submit real
orders only when explicitly armed with operator-selected ceilings. A successful
tool result means submitted, not filled. The system is **not** ready for
unattended or material capital.

Before live use, Murre needs authenticated and signed state inputs, a durable
multi-host database, external key custody, an isolated relay, a formally
specified wire protocol, reconciliation against a real venue, operational
monitoring, and independent security review.

Robinhood MCP is implemented as an experimental adapter to Robinhood's official
remote endpoint. Murre is independent and is not affiliated with Robinhood.
Robinhood Chain asset-registry and settlement adapters remain future work.

Read the [security model](SECURITY.md), [architecture](docs/architecture.md),
[policy model](docs/policy.md), [receipt format](docs/receipts.md), and
[paper-mode contract](docs/paper-mode.md), plus the
[agent-facing MCP server](docs/mcp-server.md) and
[Robinhood MCP relay](docs/robinhood-mcp.md).

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
