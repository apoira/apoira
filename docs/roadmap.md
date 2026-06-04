# Roadmap

Mote is being built as an agent control plane, not just a command runner. The
runtime should eventually let agents work across terminals, files, browsers,
deploy tools, and remote environments while keeping policy and replay in one
place.

## v0.1: Local Runtime

Status: working prototype.

- project initialization
- command allow/ask/deny policy
- sensitive path deny rules
- local secret storage
- secret injection through environment variables
- stdout/stderr secret redaction
- append-only event log
- replay output
- minimal JSON-RPC/MCP-style stdio adapter

## v0.2: Agent Integration

Goal: make Mote usable by coding agents without custom glue.

- full MCP SDK server
- richer tool schemas
- per-agent identity
- agent-scoped policy rules
- structured command results
- policy errors written for both humans and models

## v0.3: Approvals

Goal: make risky actions reviewable before execution.

- pending approval queue
- approval tokens
- web approval surface
- policy reasons and diffs in approval prompts
- command retry after approval
- signed approval events

## v0.4: Filesystem Controls

Goal: protect local projects from unsafe reads, writes, and exports.

- file read/write mediation
- artifact export controls
- checkpoint creation
- rollback to checkpoint
- file diff logging
- denied path enforcement across runtime tools

## v0.5: Secrets and Taint

Goal: let agents use private credentials without leaking them.

- encrypted local vault
- remote secret-manager adapters
- secret access leases
- secret-tainted output tracking
- blocked exfiltration attempts
- replayable secret access proofs without revealing values

## v0.6: Browser and Network Policy

Goal: control where agents can send data.

- network domain allow/deny rules
- browser action logging
- upload/download mediation
- form submission policy
- blocked request replay

## v1.0: Isolated Execution

Goal: provide stronger guarantees around execution boundaries.

- container or microVM backend
- host/project mount policy
- isolated environment snapshots
- deterministic replay metadata
- production-grade audit logs
