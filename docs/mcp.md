# MCP Adapter

Mote exposes a small JSON-RPC stdio adapter for early agent integrations.

Start it from a project:

```bash
mote serve --mcp --project ./my-project
```

The current adapter is intentionally minimal. It follows the shape of MCP tool
servers, but avoids depending on a specific SDK while the runtime API is still
settling.

## Methods

Initialize:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
```

List tools:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

Call a tool:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "mote_run",
    "arguments": {
      "command": ["npm", "test"]
    }
  }
}
```

## Tools

### `mote_status`

Returns project root, policy, event count, and secret count.

```json
{
  "name": "mote_status",
  "arguments": {}
}
```

### `mote_run`

Runs a command through policy.

```json
{
  "name": "mote_run",
  "arguments": {
    "command": ["npm", "test"],
    "approved": false
  }
}
```

### `mote_approvals`

Lists approval records. Pending approvals are returned by default.

```json
{
  "name": "mote_approvals",
  "arguments": {
    "status": "pending"
  }
}
```

The adapter deliberately does not expose approval-granting tools yet. Agents can
request or observe approval boundaries, but human approval should happen through
the CLI or a future signed approval surface.

### `mote_allow`

Adds a command allow rule.

```json
{
  "name": "mote_allow",
  "arguments": {
    "pattern": "npm test"
  }
}
```

### `mote_ask`

Adds a command approval rule.

```json
{
  "name": "mote_ask",
  "arguments": {
    "pattern": "git push"
  }
}
```

### `mote_deny_path`

Adds a denied path pattern.

```json
{
  "name": "mote_deny_path",
  "arguments": {
    "pattern": ".env"
  }
}
```

### `mote_secret_use`

Runs a command with a named secret injected into the environment.

```json
{
  "name": "mote_secret_use",
  "arguments": {
    "name": "DEPLOY_TOKEN",
    "command": ["node", "-e", "console.log(process.env.MOTE_SECRET_DEPLOY_TOKEN)"]
  }
}
```

### `mote_replay`

Returns the append-only event log.

```json
{
  "name": "mote_replay",
  "arguments": {}
}
```

## Integration Notes

Agents should call `mote_status` before acting, use policy update tools only
when explicitly allowed by the user, and treat `approval_required` results as a
hard stop.

The full MCP SDK implementation should preserve this contract while adding
better schemas, agent identity, and signed approval events.
