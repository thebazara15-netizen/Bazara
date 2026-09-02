import Link from "next/link";
import Icon from "../Icons";

export function getSupplierName(supplier) {
  return supplier.companyName || [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") || "Supplier storefront";
}

export default function SupplierCard({ supplier }) {
  const companyName = getSupplierName(supplier);
  const contactName = supplier.companyName ? [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") : "";

  return (
    <article className="min-w-0">
      <Link href={`/suppliers/${supplier.id}`} className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-slate-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon name="storefront" className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-bold leading-6 text-slate-950 group-hover:text-orange-700">{companyName}</h2>{supplier.isVerified === true && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><Icon name="shield" className="h-3 w-3" />Verified supplier</span>}</div>
            {contactName && <p className="mt-1 text-sm text-slate-500">{contactName}</p>}
            {supplier.businessType && <p className="mt-1 text-sm text-slate-500">{supplier.businessType}</p>}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-1 break-words font-bold text-slate-800">{supplier.location || "Not provided"}</dd></div><div><dt className="text-xs text-slate-500">Products listed</dt><dd className="mt-1 font-bold text-slate-800">{supplier.productCount ?? 0}</dd></div></dl>

        {Array.isArray(supplier.categories) && supplier.categories.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{supplier.categories.slice(0, 4).map((category) => <span key={category} className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{category}</span>)}</div>}
        <span className="mt-auto pt-5 text-sm font-bold text-orange-700">View storefront →</span>
      </Link>
    </article>
  );
}
