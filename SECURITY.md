# Security policy

## Supported versions

Murre is pre-production software. Security fixes are applied only to the
latest commit on `main`.

## Current threat model

Version 0.4 assumes a trusted local host and untrusted portfolio proposals. The
kernel is designed to prevent a proposal from silently expanding its own
authority. It checks explicit policy and state inputs, binds permits to exact
orders, expires them, and records single-use consumption in a hash-chained
ledger.

The experimental Robinhood MCP bridge additionally assumes that the local OAuth
store, policy file, state file, event ledger, operator, and Robinhood Agentic
account are trustworthy. It binds the exact remote limit-order arguments into
the permit and never stores OAuth tokens in the event ledger.

The reference implementation does **not** defend against a compromised host,
malicious administrator, forged state snapshot, filesystem rollback, stolen
signing key, multi-host race, or compromised execution venue.

## Not approved for unattended or material capital

Version 0.4 contains an explicitly armed command capable of placing one real
equity order through Robinhood's dedicated Agentic account. Use only a small,
separately funded account while evaluating the integration. A production
deployment requires at least:

- authenticated callers and signed, freshness-bounded state snapshots;
- fixed-point monetary arithmetic and a formally versioned wire protocol;
- an ACID database with atomic permit consumption across hosts;
- independent key custody and an isolated credentialed relay;
- idempotent order submission and venue reconciliation;
- rate limits, observability, incident response, backups, and recovery drills;
- external security review and jurisdiction-specific legal review.

Do not paste Robinhood credentials, OAuth authorization codes, access tokens,
refresh tokens, account data, or `.murre/robinhood-oauth.json` into issues,
commits, chat, logs, or support messages. Revoke Robinhood access immediately if
the OAuth store or its host may be compromised.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not place
exploit details, credentials, account data, or private market information in a
public issue.
