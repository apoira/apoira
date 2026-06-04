# Mote

[![CI](https://github.com/moteMCP/mote/actions/workflows/ci.yml/badge.svg)](https://github.com/moteMCP/mote/actions/workflows/ci.yml)

Policy, secrets, approvals, and replay for AI agents using real computers.

Mote gives agents a controlled runtime boundary. Instead of handing an agent raw
access to a terminal, browser, local files, or deploy token, you route actions
through Mote and define what the agent can do.

```text
agent -> Mote API -> policy check -> runtime -> append-only event log
```

## Why Mote

Agent sandboxes answer where an agent runs. Mote focuses on what the agent is
allowed to do once it can act.

The core idea is simple:

- agents should be able to use tools and credentials
- credentials should not be revealed to the model
- risky actions should pause for approval
- blocked files and paths should stay blocked
- every action should be replayable after the run

Mote is not trying to be another chat UI or a generic VM wrapper. It is an
agent-native control layer for commands, secrets, approvals, and auditability.

## Current Status

Mote is early, but the local runtime is functional.

What works now:

- command policy with `allow`, `ask`, and `deny` rules
- blocked path patterns for sensitive files like `.env`, `.git`, `.ssh`, and
  `.mote/secrets.json`
- local secret storage with runtime environment injection
- stdout/stderr redaction for injected secrets
- append-only event logs in `.mote/events.jsonl`
- replay output for audits and demos
- a minimal JSON-RPC/MCP-style stdio adapter for agent integrations

Still in progress:

- encrypted production secret backends
- browser and network egress controls
- secret taint tracking across tool outputs
- filesystem checkpoints and rollback
- stronger process isolation through containers or microVMs
- approval UI beyond the local `--yes` flow

## Install

```bash
npm install
npm link
```

Or run it directly from the repo:

```bash
node src/cli.js status
```

## Quickstart

Initialize a project:

```bash
mote init ./my-project
```

Allow safe commands:

```bash
mote allow "npm test" --project ./my-project
mote allow "npm run build" --project ./my-project
```

Require approval for risky commands:

```bash
mote ask "git push" --project ./my-project
mote ask "vercel deploy" --project ./my-project
```

Block sensitive paths:

```bash
mote deny ".env" --project ./my-project
mote deny ".env.*" --project ./my-project
mote deny ".ssh/**" --project ./my-project
```

Run a command through policy:

```bash
mote run npm test --project ./my-project
```

If a command matches an `ask` rule, Mote records the approval boundary and stops:

```bash
mote run git push --project ./my-project
# approval required
```

For the local prototype, `--yes` acts as the approval grant:

```bash
mote run git push --project ./my-project --yes
```

## Secret Injection

Store a local secret:

```bash
mote secret:set DEPLOY_TOKEN sk_live_example --project ./my-project
```

Allow the command you want the agent to run:

```bash
mote allow "node -e *" --project ./my-project
```

Run the command with the secret injected:

```bash
mote secret:use DEPLOY_TOKEN -- node -e "console.log(process.env.MOTE_SECRET_DEPLOY_TOKEN)" --project ./my-project
```

The process receives `MOTE_SECRET_DEPLOY_TOKEN`, but command output and event
logs redact the raw value:

```text
[secret:DEPLOY_TOKEN]
```

## Replay

Every meaningful runtime action is appended to `.mote/events.jsonl`.

```bash
mote replay --project ./my-project
```

Recorded events include:

- `project.initialized`
- `policy.updated`
- `command.requested`
- `command.blocked`
- `command.approval_required`
- `approval.granted`
- `secret.stored`
- `secret.accessed`
- `command.completed`

## Agent Adapter

Start the stdio adapter:

```bash
mote serve --mcp --project ./my-project
```

The adapter accepts JSON-RPC lines and currently supports:

- `initialize`
- `tools/list`
- `tools/call`

Available tools:

- `mote_status`
- `mote_run`
- `mote_allow`
- `mote_ask`
- `mote_deny_path`
- `mote_secret_use`
- `mote_replay`

This is intentionally small while the policy surface stabilizes. The next step
is replacing the minimal adapter with a full MCP SDK implementation.

## Demo

```bash
npm run demo
```

The demo initializes a temporary project, adds policy rules, stores a secret,
proves secret redaction, blocks `.env`, and shows an approval boundary for
`git push`.

## Documentation

- [Architecture](docs/architecture.md)
- [Policy](docs/policy.md)
- [Roadmap](docs/roadmap.md)
- [Security](SECURITY.md)

## Development

```bash
npm test
```

Mote currently has no runtime dependencies. Tests use Node's built-in test
runner.

## License

MIT
