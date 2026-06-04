# Security

Mote is an early prototype. It is useful for local policy and replay testing,
but it should not be treated as production-grade isolation yet.

## Current Protections

- command allow/ask/deny policy
- sensitive path deny rules
- local approval boundary for risky commands
- secret injection through environment variables
- redaction of injected secrets from stdout, stderr, and event logs
- append-only local event logs for replay

## Current Limits

- the local secret vault is base64 encoded, not encrypted
- commands run on the host machine
- there is no kernel-level filesystem sandbox yet
- denied path rules are part of the runtime policy surface, not a full OS
  sandbox
- browser and network egress controls are not implemented yet
- secret taint tracking is not implemented yet
- checkpoint and rollback are not implemented yet

## Reporting

Please report security issues privately to the repository maintainers. Avoid
posting exploit details in public issues until a fix is available.
