import { formatPrice, getValidTiers } from "./pricing";

export default function PriceTierTable({ product }) {
  const tiers = getValidTiers(product);
  if (tiers.length === 0) return null;
  const margin = Number.isFinite(Number(product.margin)) ? Number(product.margin) : 0;

  return (
    <section aria-labelledby="tier-pricing-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="marketplace-eyebrow">Volume pricing</p><h2 id="tier-pricing-title" className="mt-2 text-lg font-bold text-slate-950">Wholesale price tiers</h2></div>
        <p className="text-xs text-slate-500">Per unit</p>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-4 py-3 font-bold">Quantity</th><th scope="col" className="px-4 py-3 text-right font-bold">Unit price</th></tr></thead>
          <tbody className="divide-y divide-slate-200">{tiers.map((tier, index) => { const next = tiers[index + 1]; const price = tier.price * (1 + margin / 100); return <tr key={`${tier.minQty}-${tier.price}`}><td className="px-4 py-3 font-semibold text-slate-800">{next ? `${tier.minQty}–${next.minQty - 1} units` : `${tier.minQty}+ units`}</td><td className="px-4 py-3 text-right font-bold text-slate-950">{formatPrice(price)}</td></tr>; })}</tbody>
        </table>
      </div>
    </section>
  );
}
