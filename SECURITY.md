# Security policy

## Supported versions

Murre is pre-production software. Security fixes are applied only to the
latest commit on `main`.

## Current threat model

Version 0.2 assumes a trusted local host and untrusted portfolio proposals. The
kernel is designed to prevent a proposal from silently expanding its own
authority. It checks explicit policy and state inputs, binds permits to exact
orders, expires them, and records single-use consumption in a hash-chained
ledger.

The reference implementation does **not** defend against a compromised host,
malicious administrator, forged state snapshot, filesystem rollback, stolen
signing key, multi-host race, or compromised execution venue.

## Not approved for live capital

Do not connect this repository to a live brokerage, exchange, wallet, or
custody account. A production deployment requires at least:

- authenticated callers and signed, freshness-bounded state snapshots;
- fixed-point monetary arithmetic and a formally versioned wire protocol;
- an ACID database with atomic permit consumption across hosts;
- independent key custody and an isolated credentialed relay;
- idempotent order submission and venue reconciliation;
- rate limits, observability, incident response, backups, and recovery drills;
- external security review and jurisdiction-specific legal review.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not place
exploit details, credentials, account data, or private market information in a
public issue.
