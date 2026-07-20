# Decision receipts

A receipt records:

- schema version and evaluation time;
- decision identifier;
- hashes of the policy, state snapshot, and normalized intent;
- every check, including observed and configured values;
- the final `ALLOW` or `DENY` result;
- a permit when and only when every check passes.

The decision identifier is the SHA-256 hash of the receipt body before the
identifier and permit are attached. Receipts are therefore replayable evidence
of what the kernel evaluated, not evidence that an order settled.

Permits are separate capability objects. V1 signs nothing and stores
consumption only in memory, so they must not be treated as production
credentials.
