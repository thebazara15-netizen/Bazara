import Link from "next/link";
import Icon from "./Icons";
import SectionHeader from "./SectionHeader";

function SupplierCard({ supplier }) {
  const name = supplier.companyName || [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") || "Supplier";

  return (
    <Link href={`/suppliers/${supplier.id}`} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-slate-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon name="storefront" className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-slate-950 group-hover:text-orange-700">{name}</h3>
            {supplier.isVerified === true && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><Icon name="shield" className="h-3 w-3" />Verified</span>}
          </div>
          {supplier.businessType && <p className="mt-1 truncate text-sm text-slate-500">{supplier.businessType}</p>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div><p className="text-xs text-slate-500">Products</p><p className="mt-1 font-bold text-slate-900">{supplier.productCount ?? 0}</p></div>
        <div><p className="text-xs text-slate-500">Location</p><p className="mt-1 truncate font-bold text-slate-900">{supplier.location || "Not provided"}</p></div>
      </div>
      {Array.isArray(supplier.categories) && supplier.categories.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{supplier.categories.slice(0, 3).map((category) => <span key={category} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{category}</span>)}</div>}
    </Link>
  );
}

export default function SupplierSection({ suppliers, loading, error }) {
  return (
    <section className="border-y border-slate-200 bg-slate-100/70 py-14 sm:py-16">
      <div className="marketplace-container">
        <SectionHeader eyebrow="Supplier network" title="Discover marketplace suppliers" description="Explore supplier profiles, business locations, and available product categories." href="/suppliers" linkLabel="View all suppliers" />
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />) : error ? <div className="col-span-full rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Suppliers could not be loaded right now.</div> : suppliers.length > 0 ? suppliers.slice(0, 6).map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="storefront" /></span><h3 className="mt-4 font-bold text-slate-950">Supplier profiles are coming soon</h3><p className="mt-2 text-sm text-slate-600">Businesses joining the Bazara supplier network will appear here.</p></div>}
        </div>
      </div>
    </section>
  );
}
