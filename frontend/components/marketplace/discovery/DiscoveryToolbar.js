"use client";

export default function DiscoveryToolbar({ total, loading, sort, onSort, onOpenFilters, activeFilterCount }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <p className="text-sm text-slate-600" aria-live="polite">{loading ? "Loading products…" : <><strong className="text-slate-950">{total}</strong> product{total === 1 ? "" : "s"}</>}</p>
      <div className="flex flex-1 items-center justify-end gap-2">
        <button type="button" onClick={onOpenFilters} aria-haspopup="dialog" className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 lg:hidden">Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</button>
        <label htmlFor="product-sort" className="sr-only">Sort products</label>
        <select id="product-sort" value={sort} onChange={(event) => onSort(event.target.value)} className="min-h-10 max-w-48 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"><option value="newest">Newest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="moq_asc">MOQ: Low to High</option></select>
      </div>
    </div>
  );
}
