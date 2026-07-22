# Murre

[![CI](https://github.com/murreMCP/murre/actions/workflows/ci.yml/badge.svg)](https://github.com/murreMCP/murre/actions/workflows/ci.yml)
[![Node.js 20.10+](https://img.shields.io/badge/node-%3E%3D20.10-417E38)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-111111)](LICENSE)

**Financial tools agents can call.**

[Website](https://murre.xyz) · [X / @murreMCP](https://x.com/murreMCP)

Murre is an open MCP toolkit for agentic finance. Today it connects agents to
Robinhood public-equity research, account state, user-defined policy, guarded
live execution, and a hash-chained event history.

The project is expanding into portfolio construction, monitoring, tokenized
assets, and additional venues. Those capabilities share one rule: account
access, credentials, and execution authority remain outside the calling model.

For every proposed order, Murre turns independently supplied state and a
versioned policy into one of two proof objects:

- a denial receipt explaining exactly which constraints failed; or
- a short-lived, single-use permit bound to the exact order.

The calling agent can change its models without expanding its authority.
Only the credentialed execution boundary may route an order, and only when the
order matches a valid permit.

> Murre is not an AI fund, broker, wallet, or trading venue. Version 0.6 adds an
> opt-in live MCP tool for bounded equity limit orders through Robinhood's
> official Trading MCP. Paper mode remains the default. Live mode can move real
> money and is not approved for unattended or material capital.

## Why this exists

Agentic finance needs two different kinds of tools:

1. **Understand and operate.** Read accounts, research assets, construct
   portfolios, monitor activity, and propose actions. This surface should grow
   quickly as models, assets, and venues improve.
2. **Control capital.** Decide what may execute, under which facts and limits.
   This boundary should stay small, deterministic, replayable, and independently
   deployable.

Murre is building both behind one MCP interface. The control path is the most
complete part today; the broader toolkit is being added without presenting
planned capabilities as live.

```text
target weights ──> rebalance planner ──> order intents
                                             │
policy + state snapshot ────────────> Murre kernel
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
- one-command OAuth onboarding and Robinhood-derived portfolio snapshots;
- a read-only `murre_research_equity` tool that assembles quotes, fundamentals,
  RSI, and earnings into timestamped, hash-addressed evidence;
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

Set up a dedicated Robinhood Agentic account without placing an order. This
completes OAuth, verifies the account and remote tools, reads the portfolio,
positions, quotes, and tradability, then creates private local files with small
default ceilings ($25/order, $75/session, 3 orders):

```bash
npm run setup:robinhood -- \
  --robinhood-account-number YOUR_AGENTIC_ACCOUNT_NUMBER \
  --symbols AAPL,MSFT
```

`--symbols` adds equities the account does not already hold. Murre never chooses
an account for the user, and setup never reviews or places an order. OAuth
tokens, the account number, policy, state, and ledger stay under the gitignored
`.murre/` directory. Do not share that directory.

You can edit Murre's generated portfolio rules directly in the terminal. Press
Enter to keep any current value:

```bash
npm run configure
```

For scripts and automated deployments, the same editor accepts flags:

```bash
npm run configure -- \
  --max-order-notional 25 \
  --max-session-notional 75 \
  --max-orders 3 \
  --max-position-pct 20 \
  --min-cash-pct 10
```

Start Murre in read-only research mode first:

```bash
npm run mcp:research
```

This mode exposes `murre_status`, `murre_research_equity`, and
`murre_recent_events`. It does not register a paper or live order tool. Ask the
connected agent to research one public equity:

```text
Use murre_research_equity to research AAPL. Return the evidence.
```

The tool reads Robinhood's quote, fundamentals, daily RSI, and earnings tools.
It returns normalized public-market evidence with its observation time and a
domain-separated SHA-256 hash. It does not read the Agentic account or call an
order tool. The same path is available as a terminal demonstration:

```bash
npm run research -- --symbol AAPL
```

To give the connected agent bounded real-order authority instead, restart Murre
in live mode after reviewing `.murre/live-policy.json`:

```bash
npm run mcp:live
```

This intentionally gives the connected agent authority to submit orders up to
the configured ceilings without a new human confirmation for every call. The
agent receives `murre_status`, `murre_research_equity`,
`murre_recent_events`, and `murre_live_order`; paper mutation tools are removed
while live mode is armed.

Before another live attempt, reconcile Robinhood activity and refresh only the
broker-derived state. The command preserves the policy and audit ledger:

```bash
npm run refresh:robinhood
```

See [the guarded Robinhood MCP relay](docs/robinhood-mcp.md) before enabling
live routing.

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

Bootstrap and refresh the generated live configuration:

```bash
npm run setup:robinhood -- --robinhood-account-number YOUR_ACCOUNT --symbols AAPL
npm run refresh:robinhood
```

## Trust boundary

Agents receive no venue credential. In paper mode they submit bounded intents.
In live MCP mode the read-only research call accepts one public symbol. Order
calls accept only symbol, side, quantity, limit price, and an optional intent
ID; the operator fixes every authority-bearing input when the server starts.
Changing any execution field changes the intent hash and invalidates its permit.

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
src/robinhood-setup.js authenticated read-only setup and state refresh
src/research.js     normalized, hash-addressed public-equity evidence
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

Setup derives local state from authenticated Robinhood reads, but those
snapshots are not signed or independently attested. Before material live use,
Murre needs signed state inputs, a durable
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
