"use client";

import { useState } from "react";

function FilterFields({ values, categories, onApply, onClear, onClose }) {
  const [category, setCategory] = useState(values.category);
  const [minPrice, setMinPrice] = useState(values.minPrice);
  const [maxPrice, setMaxPrice] = useState(values.maxPrice);
  const [maxMoq, setMaxMoq] = useState(values.maxMoq);

  const submit = (event) => {
    event.preventDefault();
    onApply({ category, minPrice, maxPrice, maxMoq });
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-bold text-slate-950">Category</legend>
        {categories.length > 0 ? <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select> : <p className="mt-2 text-sm leading-6 text-slate-500">No product-backed categories are available yet.</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-slate-950">Unit price</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div><label htmlFor="minimum-price" className="text-xs text-slate-500">Minimum ₹</label><input id="minimum-price" type="number" inputMode="decimal" min="0" step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100" /></div>
          <div><label htmlFor="maximum-price" className="text-xs text-slate-500">Maximum ₹</label><input id="maximum-price" type="number" inputMode="decimal" min="0" step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any" className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100" /></div>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Price filters include products with a public price in this range.</p>
      </fieldset>

      <div><label htmlFor="maximum-moq" className="text-sm font-bold text-slate-950">Maximum MOQ</label><input id="maximum-moq" type="number" inputMode="numeric" min="1" step="1" value={maxMoq} onChange={(event) => setMaxMoq(event.target.value)} placeholder="Any minimum order" className="mt-3 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100" /></div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-5"><button type="button" onClick={() => { onClear(); onClose?.(); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Clear</button><button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Apply filters</button></div>
    </form>
  );
}

export function DesktopProductFilters(props) {
  return <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block" aria-label="Product filters"><div className="mb-6"><p className="marketplace-eyebrow">Refine results</p><h2 className="mt-2 text-lg font-bold text-slate-950">Filters</h2></div><FilterFields {...props} /></aside>;
}

export function MobileProductFilters({ open, onClose, ...props }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="ml-auto flex h-full w-[min(92vw,24rem)] flex-col overflow-y-auto bg-white p-5 shadow-2xl"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="marketplace-eyebrow">Refine results</p><h2 id="mobile-filter-title" className="mt-2 text-xl font-bold text-slate-950">Filters</h2></div><button type="button" onClick={onClose} aria-label="Close filters" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">×</button></div><FilterFields {...props} onClose={onClose} /></aside></div>;
}
