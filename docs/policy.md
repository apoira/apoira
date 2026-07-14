# Policy model

The example policy is JSON and intentionally small. It defines:

- permitted venues;
- an absolute order-notional ceiling;
- a maximum limit-price deviation from the state snapshot;
- portfolio concentration, gross-exposure, and minimum-cash limits;
- maximum valuation age and minimum available liquidity by asset class;
- the lifetime of an issued permit.

Policies carry a human-readable `id` and semantic `version`. Every decision
receipt embeds a hash of the complete policy, so changing any rule creates a
different proof object.

Percentages are expressed as numbers from `0` to `100`. Dollar values are
expressed as JSON numbers in USD for this reference implementation. Production
systems should use fixed-point integers in the smallest supported unit.
