import { formatPrice, getValidTiers, hasPrice } from "./pricing";

export default function ProductInfo({ product }) {
  const moq = Number.isFinite(Number(product.moq)) ? Number(product.moq) : null;
  const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : null;
  const basePrice = hasPrice(product.basePrice) ? formatPrice(product.basePrice) : null;
  const hasOverview = Boolean(product.category) || moq !== null || stock !== null || basePrice;

  return (
    <div className="space-y-5">
      {hasOverview && <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="overview-title"><p className="marketplace-eyebrow">Product information</p><h2 id="overview-title" className="mt-2 text-xl font-bold text-slate-950">Product overview</h2><dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">{product.category && <div className="bg-slate-50 px-4 py-4"><dt className="text-xs font-semibold text-slate-500">Category</dt><dd className="mt-1 font-bold text-slate-900">{product.category}</dd></div>}{moq !== null && <div className="bg-slate-50 px-4 py-4"><dt className="text-xs font-semibold text-slate-500">Minimum order</dt><dd className="mt-1 font-bold text-slate-900">{moq} units</dd></div>}{stock !== null && <div className="bg-slate-50 px-4 py-4"><dt className="text-xs font-semibold text-slate-500">Recorded availability</dt><dd className="mt-1 font-bold text-slate-900">{stock} units</dd></div>}{basePrice && <div className="bg-slate-50 px-4 py-4"><dt className="text-xs font-semibold text-slate-500">Supplier base price</dt><dd className="mt-1 font-bold text-slate-900">{basePrice}</dd></div>}</dl></section>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="description-title"><h2 id="description-title" className="text-xl font-bold text-slate-950">Description</h2>{product.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">{product.description}</p> : <p className="mt-4 text-sm text-slate-500">The supplier has not provided a product description yet.</p>}</section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="wholesale-title"><h2 id="wholesale-title" className="text-xl font-bold text-slate-950">MOQ / wholesale information</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{moq !== null && <p>Orders must meet the listed minimum quantity of <strong className="text-slate-900">{moq} units</strong>.</p>}{getValidTiers(product).length > 0 ? <p>Unit pricing changes at the quantity thresholds shown in the wholesale pricing table.</p> : <p>No additional volume pricing tiers are currently listed for this product.</p>}</div></section>
    </div>
  );
}
