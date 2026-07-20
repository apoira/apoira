# Threat model

## Protected property

An untrusted portfolio proposal must not execute unless it matches an allowed,
unexpired, unconsumed permit produced from the configured policy and state.

## Trusted in V0.3

- local operating system and filesystem;
- process environment and system clock;
- policy document and state-snapshot origin;
- Node.js runtime;
- repository code and operator.

## Untrusted in V0.3

- portfolio proposals and target weights;
- attempts to alter an approved order;
- permit replay;
- missing, malformed, stale, or ineligible asset facts;
- concurrent use of one local event store.

## Enforced invariants

- denied decisions contain no permit;
- the permit intent hash must match the submitted order;
- expired or consumed permits fail closed;
- one local event store serializes permit consumption;
- every event commits to the previous event hash;
- the paper relay records consumption before fill creation.

## Out of scope

Host compromise, state forgery, ledger rollback, key theft, distributed races,
venue compromise, and legal compliance are out of scope. These are deployment
requirements, not problems a local hash chain can solve.
