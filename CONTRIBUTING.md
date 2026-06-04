# Contributing

Mote is early, so the most useful contributions are small and testable.

Good first areas:

- policy matching edge cases
- better event replay output
- MCP adapter hardening
- command/path approval flows
- secret backend integrations
- checkpoint and rollback prototypes

Before opening a pull request:

```bash
npm test
```

Keep changes scoped and include tests for policy or runtime behavior when the
change affects enforcement.
