const REQUIRED_STRINGS = ["id", "accountId", "assetId", "venue"];

export function normalizeIntent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Intent must be an object");
  }

  for (const field of REQUIRED_STRINGS) {
    if (typeof input[field] !== "string" || input[field].trim() === "") {
      throw new TypeError(`${field} must be a non-empty string`);
    }
  }

  const side = String(input.side || "").toUpperCase();
  if (side !== "BUY" && side !== "SELL") {
    throw new TypeError("side must be BUY or SELL");
  }

  const quantity = Number(input.quantity);
  const limitPriceUsd = Number(input.limitPriceUsd);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new TypeError("quantity must be a positive finite number");
  }
  if (!Number.isFinite(limitPriceUsd) || limitPriceUsd <= 0) {
    throw new TypeError("limitPriceUsd must be a positive finite number");
  }

  return {
    id: input.id.trim(),
    accountId: input.accountId.trim(),
    assetId: input.assetId.trim(),
    side,
    quantity,
    limitPriceUsd,
    venue: input.venue.trim(),
  };
}
