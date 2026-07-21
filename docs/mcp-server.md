# Murre MCP server

Murre can run as a local stdio MCP server. An agent can inspect a paper
portfolio, propose exact orders or target weights, receive deterministic
policy receipts, and run allowed paper fills through Murre's permit and audit
path.

The server is paper-only. It does not expose the Robinhood live-order relay,
OAuth material, arbitrary file access, or a tool for changing policy. The
operator fixes the policy, state, ledger, account, and minimum trade size when
starting the server.

## Tools

| Tool | Effect |
| --- | --- |
| `murre_status` | Reads the policy identity, paper portfolio, asset facts, and ledger health. |
| `murre_check_order` | Records an allow or deny receipt for one exact order. It never fills it. |
| `murre_paper_order` | Checks one exact order, consumes an allow permit, records a paper fill, and persists paper state. |
| `murre_rebalance` | Converts target weights into paper orders and runs each through the same policy and permit path. |
| `murre_recent_events` | Reads the newest records from the verified hash-chained ledger. |

The calling agent supplies only `assetId`, `side`, `quantity`, `limitPriceUsd`,
an optional correlation ID, or target weights. Murre injects the configured
account and paper venue and uses its own current time.

## Prepare local paper files

Never point the server at `examples/state.json` directly because paper tools
persist state. Copy it into the ignored `.murre` directory and update the
snapshot's valuations to the time you intend to run it.

PowerShell:

```powershell
New-Item -ItemType Directory -Force .murre
Copy-Item examples/state.json .murre/paper-state.json
```

Start the server manually:

```powershell
node src/mcp-server.js `
  --policy examples/policy.json `
  --state .murre/paper-state.json `
  --ledger .murre/mcp-events.jsonl `
  --account paper-fund-01
```

It speaks MCP over stdin/stdout, so a terminal will appear idle after the
startup line. That is expected; an MCP client normally launches it.

## Connect an MCP client

Use absolute paths in the client's MCP configuration. On Windows, a generic
configuration looks like this:

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

The paths may instead be supplied through `MURRE_POLICY_PATH`,
`MURRE_STATE_PATH`, `MURRE_LEDGER_PATH`, and `MURRE_ACCOUNT_ID`.
`MURRE_MIN_TRADE_NOTIONAL_USD` is optional and defaults to `100`.

## Recommended agent sequence

1. Call `murre_status` and use only asset IDs and prices present in that
   response.
2. Use `murre_check_order` when a decision receipt is needed without changing
   the paper book.
3. Use `murre_paper_order` for a single paper fill or `murre_rebalance` for a
   target portfolio.
4. Read `murre_recent_events` to confirm the resulting proof trail.

The policy and state files are re-read for every operation. Mutating calls are
serialized inside the server, state is replaced through a temporary file, and
permits are consumed through the locked JSONL ledger.

## Current boundary

This makes Murre callable agent infrastructure for local paper operation. It
does not make the local JSON snapshot an authenticated brokerage fact, and it
does not make the system safe for unattended capital. A production service
still needs authenticated state inputs, a multi-host transactional database,
credential isolation, reconciliation, operator approvals, and security review.

The existing Robinhood adapter remains a separate, explicitly armed
integration prototype. Keeping it out of the agent-facing MCP surface is an
intentional fail-closed boundary in version 0.5.
