import Link from "next/link";
import Icon from "../Icons";

export function SupplierDirectorySkeleton() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading suppliers">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>;
}

export function SupplierDirectoryEmpty({ query, onClear }) {
  return <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center sm:py-20"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="storefront" className="h-7 w-7" /></span><h2 className="mt-5 text-xl font-bold text-slate-950">{query ? `No suppliers found for “${query}”` : "No supplier storefronts available yet"}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{query ? "Try a broader company name, supplier name, or location." : "Supplier storefronts will appear here as businesses join the marketplace."}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{query && <button type="button" onClick={onClear} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Clear search</button>}<Link href="/rfq" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800">Post an RFQ</Link></div></section>;
}

export function SupplierDirectoryError() {
  return <section role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-14 text-center"><h2 className="text-xl font-bold text-rose-950">Suppliers could not be loaded</h2><p className="mt-2 text-sm text-rose-700">Please refresh the page or try again shortly.</p></section>;
}
