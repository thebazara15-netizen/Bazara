"use client";

export default function DiscoveryPagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  return <nav aria-label="Product results pages" className="mt-9 flex flex-wrap items-center justify-center gap-2"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{pages.map((item) => <button key={item} type="button" onClick={() => onPage(item)} aria-current={item === page ? "page" : undefined} aria-label={`Page ${item}`} className={`h-10 min-w-10 rounded-xl px-2 text-sm font-bold ${item === page ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{item}</button>)}<button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>;
}
