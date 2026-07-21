# Murre MCP server

Murre runs as a local stdio MCP server in one of two modes. Paper mode is the
default. Live mode is a separate, explicitly armed process that can submit real
equity limit orders through Robinhood's official Trading MCP.

The operator, not the calling agent, fixes the policy, state, ledger, account,
clock, OAuth store, and live ceilings when the server starts. Neither mode
exposes arbitrary file access or a tool for changing policy.

## Paper-mode tools

| Tool | Effect |
| --- | --- |
| `murre_status` | Reads the policy identity, paper portfolio, asset facts, and ledger health. |
| `murre_check_order` | Records an allow or deny receipt for one exact order without filling it. |
| `murre_paper_order` | Checks, consumes, records a paper fill, and persists paper state. |
| `murre_rebalance` | Converts target weights into paper orders and applies the same permit path. |
| `murre_recent_events` | Reads records from the verified hash-chained ledger. |

The calling agent supplies an asset, side, quantity, limit price, optional
correlation ID, or target weights. Murre injects the configured paper account
and venue and uses its own current time.

## Prepare paper mode

Never point the server at `examples/state.json` directly because paper tools
persist state. Copy it into the ignored `.murre` directory and refresh its
valuations before use.

```powershell
New-Item -ItemType Directory -Force .murre
Copy-Item examples/state.json .murre/paper-state.json
node src/mcp-server.js `
  --policy examples/policy.json `
  --state .murre/paper-state.json `
  --ledger .murre/mcp-events.jsonl `
  --account paper-fund-01
```

## Live-mode tools

| Tool | Effect |
| --- | --- |
| `murre_status` | Reads policy, supplied portfolio facts, ledger health, and remaining session capacity. |
| `murre_live_order` | Evaluates, reviews, consumes, and submits one bounded equity limit order. |
| `murre_recent_events` | Reads records from the verified hash-chained ledger. |

Paper mutation tools are not registered in live mode. The agent can provide
only `ticker`, `side`, `quantity`, `limitPriceUsd`, `timeInForce: "gfd"`, and an
optional `intentId`. The server fixes:

- account `robinhood-agentic`;
- the Robinhood Agentic account number;
- venue `robinhood-mcp`;
- tool `place_equity_order`;
- order type `limit` and time-in-force `gfd`;
- policy, state, ledger, OAuth path, clock, and session ceilings.

The live slice supports quantity-based long equity limit orders only. It does
not support options, crypto, tokenized private assets, market orders, notional
shortcuts, or short selling.

## Prepare live mode

First complete Robinhood OAuth in an interactive terminal. The MCP server never
opens a browser or waits for OAuth during an agent call.

```powershell
node src/cli.js robinhood-auth `
  --oauth-store .murre/robinhood-oauth.json
```

Create a live policy that allows `robinhood-mcp` and a fresh state snapshot for
`robinhood-agentic`. Every asset the agent may trade must independently record
the venue, eligibility, reference price, price timestamp, liquidity, position,
and portfolio facts required by the policy. A local snapshot is operator input;
Murre 0.6 does not authenticate it against Robinhood.

Start the live server with the exact activation value and all three ceilings:

```powershell
node src/mcp-server.js `
  --policy .murre/live-policy.json `
  --state .murre/live-state.json `
  --ledger .murre/live-events.jsonl `
  --account robinhood-agentic `
  --live-routing LIVE_ROBINHOOD_MCP `
  --robinhood-account-number $env:MURRE_ROBINHOOD_ACCOUNT_NUMBER `
  --oauth-store .murre/robinhood-oauth.json `
  --live-max-order-notional 25 `
  --live-max-session-notional 75 `
  --live-max-orders 3
```

Environment alternatives are `MURRE_LIVE_ROUTING`,
`MURRE_ROBINHOOD_ACCOUNT_NUMBER`, `MURRE_ROBINHOOD_OAUTH_STORE`,
`MURRE_LIVE_MAX_ORDER_NOTIONAL_USD`,
`MURRE_LIVE_MAX_SESSION_NOTIONAL_USD`, and `MURRE_LIVE_MAX_ORDERS`, plus the
paper-mode path variables described below. Supplying any live option without
the exact activation value fails startup.

Starting this process delegates real order-submission authority to the connected
agent within the configured ceilings. Robinhood may not request a separate human
confirmation for each order. Keep the Agentic account separately funded and the
ceilings deliberately small.

The Agentic account number must be copied by the operator from the dedicated
account; Murre never defaults it from `get_accounts`. Prefer the environment
variable so it is not written into an MCP client configuration, and never
commit it. Murre binds it into the exact remote argument hash but redacts known
account fields and the configured number from responses and event bodies.

## Fresh-state and restart behavior

Murre records the state hash used for each live decision. After a permit is
consumed, including when placement fails or its result is ambiguous, that state
cannot authorize another live attempt. Inspect Robinhood activity, reconcile the
submitted order, and replace the state file with a fresh snapshot before calling
the tool again.

Order-count and notional ceilings are in-memory session controls and reset when
the server restarts. The fresh-state gate is rebuilt from the ledger and survives
restarts. Do not treat a restart as a safe way to increase authority.

A successful `murre_live_order` response means Robinhood accepted the submission,
not that it filled. Final status must be checked in Robinhood activity.

## Connect an MCP client

Use absolute paths in the client's configuration. A paper-mode Windows example:

```json
{
  "mcpServers": {
    "murre": {
      "command": "node",
      "args": [
        "C:\\absolute\\path\\to\\murre\\src\\mcp-server.js",
        "--policy",
        "C:\\absolute\\path\\to\\murre\\examples\\policy.json",
        "--state",
        "C:\\absolute\\path\\to\\murre\\.murre\\paper-state.json",
        "--ledger",
        "C:\\absolute\\path\\to\\murre\\.murre\\mcp-events.jsonl",
        "--account",
        "paper-fund-01"
      ]
    }
  }
}
```

The common paths may instead be supplied through `MURRE_POLICY_PATH`,
`MURRE_STATE_PATH`, `MURRE_LEDGER_PATH`, and `MURRE_ACCOUNT_ID`.
`MURRE_MIN_TRADE_NOTIONAL_USD` is optional and defaults to `100`.

The process speaks MCP over stdin/stdout. A manually started terminal appears
idle after the startup message; an MCP client normally launches the process.

## Current boundary

Live MCP mode makes Murre callable real-money infrastructure, but not
production-safe infrastructure. It still trusts local files, the host, and the
operator; lacks authenticated brokerage state, automatic order reconciliation,
multi-host transactional permit storage, and isolated credential custody; and
has not received an independent security review. It is not approved for
unattended or material capital.
