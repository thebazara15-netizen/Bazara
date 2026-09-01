import Link from "next/link";
import Icon from "../Icons";

export default function ProductSupplierCard({ supplier, vendorId, loading }) {
  if (!vendorId) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><p className="marketplace-eyebrow">Supplier</p><h2 className="mt-2 text-lg font-bold text-slate-950">Supplier information unavailable</h2><p className="mt-2 text-sm text-slate-600">This product does not currently have a supplier profile attached.</p></section>;
  }
  if (loading) return <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-label="Loading supplier information" />;
  if (!supplier) return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><p className="marketplace-eyebrow">Supplier</p><h2 className="mt-2 text-lg font-bold text-slate-950">Supplier profile unavailable</h2><Link href={`/suppliers/${vendorId}`} className="mt-4 inline-flex text-sm font-bold text-orange-700 hover:text-orange-800">View supplier profile</Link></section>;

  const companyName = supplier.companyName || null;
  const supplierName = [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") || null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="supplier-card-title">
      <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon name="storefront" className="h-6 w-6" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 id="supplier-card-title" className="font-bold text-slate-950">{companyName || supplierName || "Supplier"}</h2>{supplier.isVerified === true && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><Icon name="shield" className="h-3 w-3" />Verified</span>}</div>{companyName && supplierName && <p className="mt-1 text-sm text-slate-500">{supplierName}</p>}</div></div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-1 font-bold text-slate-800">{supplier.location || "Not provided"}</dd></div>{supplier.productCount !== null && supplier.productCount !== undefined && <div><dt className="text-xs text-slate-500">Products listed</dt><dd className="mt-1 font-bold text-slate-800">{supplier.productCount}</dd></div>}</dl>
      <Link href={`/suppliers/${vendorId}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">View supplier profile</Link>
    </section>
  );
}
