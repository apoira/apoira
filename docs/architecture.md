# Architecture

Mote is split into four small layers.

## 1. Policy

Policy decides whether an agent action is allowed, blocked, or needs approval.

The prototype supports:

- command allow rules
- command ask rules
- command deny rules
- path deny rules

Command matching is intentionally explicit. A command that does not match an
allow or ask rule is blocked by default.

## 2. Runtime

The runtime executes approved commands in a project directory, creates pending
approvals for risky commands, injects scoped environment variables when a secret
is requested, redacts secret values from stdout/stderr, and appends lifecycle
events to `.mote/events.jsonl`.

Pending approvals are stored in `.mote/approvals.json`. The event log remains
the audit trail; the approval store is the queue state.

Runtime events include:

- `project.initialized`
- `policy.updated`
- `command.requested`
- `command.blocked`
- `command.approval_required`
- `approval.granted`
- `approval.rejected`
- `approval.used`
- `approval.completed`
- `secret.stored`
- `secret.accessed`
- `command.completed`

## 3. Secret Handling

Secrets are stored in `.mote/secrets.json` as base64-encoded values. This is not
production encryption. The point of the prototype is to prove the runtime
contract:

1. The model asks Mote to use a named secret.
2. Mote injects the value into the process environment.
3. The raw value is redacted from command output and logs.

Future versions should support encrypted local vaults, hardware-backed keys, or
remote secret managers.

## 4. Agent Adapter

`mote serve --mcp` exposes a small JSON-RPC stdio adapter with tool calls for
status, policy updates, command execution, secret use, and replay.

This lets an agent use Mote as a tool boundary:

```text
agent -> tool call -> Mote policy -> runtime -> event log
```

The adapter is deliberately small until the core policy surface settles.

See [MCP Adapter](mcp.md) for the current tool contract and example JSON-RPC
messages.

## Roadmap

- filesystem checkpoints and rollback
- browser action logging
- network egress policy
- secret taint tracking
- encrypted secret backends
- approval UI
- full MCP SDK integration
- container or microVM execution backends
