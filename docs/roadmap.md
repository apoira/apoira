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

## 0.4 - guarded Robinhood MCP bridge

- [x] official Streamable HTTP MCP client and OAuth onboarding
- [x] runtime remote-tool discovery
- [x] exact venue arguments bound into permits
- [x] Robinhood review before single-use permit consumption
- [x] one-order live relay with explicit operator arming
- [x] fail-closed tests with mocked remote tools
- [ ] authenticated Robinhood-derived state snapshots
- [ ] automatic order-status reconciliation
- [ ] OS-keychain or isolated-service token custody

## 0.5 - authenticated service

- [ ] JSON Schema documents for every protocol object
- [ ] signed state snapshots with key rotation
- [ ] HTTP or MCP service with caller authentication
- [ ] SQLite or PostgreSQL event and permit backend
- [ ] idempotency keys and crash-recovery reconciliation
- [ ] read-only registry, pricing, and chain adapters

## 0.6 - isolated relay service

- [ ] formally specified kernel-to-relay protocol
- [ ] hardware- or service-backed signing keys
- [ ] independent relay process with no research capability
- [ ] paper venue reconciliation and operational alerts
- [ ] external threat-model and security review

The guarded 0.4 bridge proves the venue integration but is not evidence that
the system is safe for unattended or material capital. Those uses remain
excluded until the remaining boundaries are independently tested.
