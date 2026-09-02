export function hasPrice(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

export function formatPrice(value) {
  if (!hasPrice(value)) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function getValidTiers(product) {
  if (!Array.isArray(product?.pricingTiers)) return [];
  return product.pricingTiers
    .filter((tier) => Number.isFinite(Number(tier?.minQty)) && Number(tier.minQty) > 0 && hasPrice(tier?.price))
    .map((tier) => ({ minQty: Number(tier.minQty), price: Number(tier.price) }))
    .sort((a, b) => a.minQty - b.minQty);
}

export function getUnitPrice(product, quantity) {
  if (!hasPrice(product?.basePrice) && !hasPrice(product?.finalPrice)) return null;
  const tiers = getValidTiers(product);
  const selectedTier = [...tiers].reverse().find((tier) => Number(quantity) >= tier.minQty);
  const margin = Number.isFinite(Number(product?.margin)) ? Number(product.margin) : 0;

  if (selectedTier) return Number((selectedTier.price * (1 + margin / 100)).toFixed(2));
  if (hasPrice(product?.basePrice)) return Number((Number(product.basePrice) * (1 + margin / 100)).toFixed(2));
  return Number(product.finalPrice);
}
