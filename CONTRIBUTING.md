# Contributing to Mandate

Mandate's authorization boundary should remain small, deterministic, and easy
to audit. Features that do not need capital authority belong outside the
kernel.

## Development setup

```bash
npm ci
npm test
npm run demo
npm run demo:cycle
```

The project intentionally has no runtime dependencies. Discuss any proposed
runtime dependency before introducing it.

## Change requirements

Policy and protocol changes must:

1. accept explicit inputs rather than fetching hidden state;
2. fail closed when a required fact is missing or invalid;
3. return a stable check identifier and a useful reason;
4. preserve deterministic output for the same inputs and evaluation time;
5. include allow, deny, boundary, and replay tests where applicable;
6. update the protocol documentation when a serialized object changes.

Do not add live credentials, private keys, account identifiers, proprietary
market data, or real investor records to examples or tests.

## Pull requests

Keep commits focused and describe the trust-boundary effect of the change.
Pull requests should state what was tested and which production assumptions
remain unresolved.
