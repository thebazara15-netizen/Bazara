"use client";

const labels = { category: "Category", minPrice: "Min price", maxPrice: "Max price", maxMoq: "Max MOQ" };

export default function ActiveFilterChips({ filters, onRemove, onClear }) {
  const active = Object.entries(filters).filter(([, value]) => value !== "");
  if (active.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">{active.map(([key, value]) => <button key={key} type="button" onClick={() => onRemove(key)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-800 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"><span>{labels[key]}: {key.toLowerCase().includes("price") ? `₹${value}` : value}</span><span aria-hidden="true">×</span><span className="sr-only">Remove filter</span></button>)}<button type="button" onClick={onClear} className="min-h-9 px-2 text-xs font-bold text-slate-600 underline underline-offset-4 hover:text-slate-950">Clear all</button></div>;
}
