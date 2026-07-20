# Roadmap

The roadmap is ordered by trust-boundary maturity, not marketing milestones.

## 0.2 - durable paper kernel

- [x] deterministic portfolio policy evaluation
- [x] content-addressed decisions and exact-order permits
- [x] domain-separated protocol hashes
- [x] hash-chained JSONL events
- [x] single-host atomic permit consumption
- [x] target-weight planning and paper fills
- [x] end-to-end CLI and automated tests

## 0.3 - authenticated paper service

- [ ] JSON Schema documents for every protocol object
- [ ] signed state snapshots with key rotation
- [ ] HTTP or MCP service with caller authentication
- [ ] SQLite or PostgreSQL event and permit backend
- [ ] idempotency keys and crash-recovery reconciliation
- [ ] read-only registry, pricing, and chain adapters

## 0.4 - isolated relay prototype

- [ ] formally specified kernel-to-relay protocol
- [ ] hardware- or service-backed signing keys
- [ ] independent relay process with no research capability
- [ ] paper venue reconciliation and operational alerts
- [ ] external threat-model and security review

Live routing is intentionally excluded until these boundaries are independently
tested. A venue integration is not evidence that the system is safe to fund.
