# Robinhood MCP relay

Murre 0.4 includes an experimental live relay for Robinhood's official Trading
MCP. It connects to `https://agent.robinhood.com/mcp/trading` over Streamable
HTTP and authenticates through Robinhood OAuth. Murre never asks for or stores
the user's Robinhood password.

This adapter can place a real equity order. It is disabled unless the operator
invokes the live command with the exact confirmation phrase documented below.
It is not approved for unattended or material capital.

Robinhood documents the current product and tool surface in its
[Agentic Trading overview](https://robinhood.com/us/en/support/articles/agentic-trading-overview/)
and [Trading with your agent](https://robinhood.com/us/en/support/articles/trading-with-your-agent/)
pages. Murre is independent and is not affiliated with Robinhood.

## Execution order

One invocation handles one order:

```text
policy + state + exact venue arguments
                  |
                  v
          deterministic evaluation
                  |
             ALLOW permit
                  |
        review_equity_order (no trade)
                  |
         consume permit atomically
                  |
         place_equity_order (live)
                  |
          hash-chained submission
```

The review happens before permit consumption. The live placement happens only
after consumption. If placement fails or the process crashes after consumption,
the permit remains spent and the operator must reconcile Robinhood order history
before attempting a replacement.

## Authenticate

Robinhood requires a primary individual account in good standing and creates a
separate Agentic account during OAuth onboarding. Authentication is supported
only on desktop.

```bash
node src/cli.js robinhood-auth \
  --oauth-store .murre/robinhood-oauth.json
```

The command prints a Robinhood authorization URL and waits on a loopback
callback. Open that URL in a desktop browser, sign in directly with Robinhood,
and approve the connection.

OAuth client registration, access tokens, refresh tokens, the PKCE verifier,
and transient OAuth state are stored in the selected JSON file with owner-only
mode where the operating system honors POSIX file permissions. `.murre/` is
gitignored. Treat this file as a live brokerage credential: do not commit,
upload, paste, or share it. Revoke the connection from Robinhood if the host or
file may be compromised.

Discover the current server-owned schemas after connecting:

```bash
node src/cli.js robinhood-tools \
  --oauth-store .murre/robinhood-oauth.json
```

Murre checks that `review_equity_order` and `place_equity_order` are present at
runtime instead of assuming the server's tool list is permanent.

## Live intent

The live relay intentionally supports a narrow first slice:

- dedicated logical account ID `robinhood-agentic`;
- venue `robinhood-mcp`;
- long equity limit orders only;
- quantity-based orders only;
- no market orders and no notional `amount` shortcut;
- the same exact arguments sent to review and placement.

Example intent shape:

```json
{
  "id": "operator-generated-unique-id",
  "accountId": "robinhood-agentic",
  "assetId": "AAPL",
  "side": "BUY",
  "quantity": 1,
  "limitPriceUsd": 100,
  "venue": "robinhood-mcp",
  "venueOrder": {
    "tool": "place_equity_order",
    "arguments": {
      "side": "buy",
      "symbol": "AAPL",
      "quantity": 1,
      "order_type": "limit",
      "limit_price": 100,
      "time_in_force": "gfd"
    }
  }
}
```

Always compare the argument enums against `robinhood-tools`; Robinhood owns the
remote schema and may change it. Murre rejects extra order fields. The symbol,
side, quantity, order type, and limit price are validated against the normalized
intent before the policy is evaluated. The entire `venueOrder` object is then
included in the intent hash and exact-order permit.

The policy must allow `robinhood-mcp`, and the state asset record must independently
confirm that venue. State freshness, price deviation, order notional, liquidity,
inventory, concentration, gross exposure, and minimum cash checks still run.

## Submit one live order

Review every input file first. This command can move real money:

```bash
node src/cli.js live-order \
  --policy ./policy.json \
  --state ./state.json \
  --intent ./intent.json \
  --ledger .murre/live-events.jsonl \
  --oauth-store .murre/robinhood-oauth.json \
  --confirm LIVE_ROBINHOOD_ORDER
```

The CLI exits `2` on a policy denial and `1` on authorization, review,
consumption, transport, or placement failure. A successful response means the
order was submitted to Robinhood, not necessarily filled. Confirm final status
in Robinhood activity and reconcile the local ledger with venue order history.

## Remaining production boundary

This adapter makes the integration real; it does not make the whole system
production-safe. Version 0.4 still trusts local policy and state files, a local
host, the system clock, and a single-host JSONL lock. It does not yet construct
signed state snapshots from Robinhood reads, use an ACID multi-host permit
store, isolate tokens in an OS keychain or separate relay service, reconcile
orders automatically, or provide a kill-switch daemon and operational alerts.

Use a separately funded Agentic account with a deliberately small balance.
Independent security and legal review remain requirements before unattended or
material use.

