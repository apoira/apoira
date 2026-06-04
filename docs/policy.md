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

Commands matched by `ask` do not run unless an approval is passed.

```bash
mote run git push
# blocked until approval

mote run git push --yes
# runs and records approval.granted
```

The current CLI uses `--yes` as a local approval stand-in. A future approval UI
can replace this without changing the runtime event model.

## Preflight Checks

Use preflight checks when an agent needs to inspect policy before acting.

```bash
mote check-command npm test
mote check-path .env
```

Both commands return structured JSON with the policy decision and the matching
rule, if any.
