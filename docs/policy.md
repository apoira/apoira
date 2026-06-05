# Policy

Mote stores policy in `.mote/policy.json`.

Example:

```json
{
  "version": 1,
  "commands": {
    "allow": ["npm test", "npm run build"],
    "ask": ["git push", "vercel deploy"],
    "deny": ["rm -rf *"]
  },
  "paths": {
    "deny": [".env", ".env.*", ".git/**", ".ssh/**", ".mote/secrets.json"]
  },
  "network": {
    "allow": [],
    "deny": []
  },
  "secrets": {
    "redact": true
  }
}
```

## Command Rules

Rules are checked in this order:

1. `deny`
2. `ask`
3. `allow`
4. default block

Wildcards use `*`.

```bash
mote allow "npm test"
mote ask "git push"
mote deny-command "rm -rf *"
```

## Path Rules

Path denies prevent sensitive files from becoming available to future runtime
features such as file reads, browser uploads, and artifact export.

```bash
mote deny ".env"
mote deny ".env.*"
mote deny ".ssh/**"
```

## Approval

Commands matched by `ask` do not run immediately. Mote creates a pending
approval record in `.mote/approvals.json` and records the boundary in the event
log.

```bash
mote run git push
# approval required: <approval-id>
```

Review the queue:

```bash
mote approvals
```

Approve and run:

```bash
mote approve <approval-id> "reviewed command"
mote run-approval <approval-id>
```

Reject:

```bash
mote reject <approval-id> "not allowed right now"
```

For quick local tests, `--yes` can still grant approval inline:

```bash
mote run git push --yes
# runs and records approval.granted
```

The persistent approval queue is the path future UI, signed approvals, and
remote approval workflows can build on.

## Preflight Checks

Use preflight checks when an agent needs to inspect policy before acting.

```bash
mote check-command npm test
mote check-path .env
```

Both commands return structured JSON with the policy decision and the matching
rule, if any.
