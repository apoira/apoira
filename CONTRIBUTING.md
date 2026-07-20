# Contributing

Keep the authorization boundary small and deterministic. New checks should:

1. accept explicit inputs rather than fetching hidden state;
2. return a stable check identifier and human-readable reason;
3. fail closed when required facts are missing;
4. include allow, deny, and boundary tests.

Run `npm test` before submitting a change.
