import Icon from "./Icons";
import SectionHeader from "./SectionHeader";
import SupplierCard from "./supplier/SupplierCard";

export default function SupplierSection({ suppliers, loading, error }) {
  return (
    <section className="border-y border-white/10 bg-[#0a0a0b] py-12 sm:py-16">
      <div className="marketplace-container">
        <SectionHeader eyebrow="Supplier network" title="Discover marketplace suppliers" description="Explore supplier profiles, business locations, and available product categories." href="/suppliers" linkLabel="View all suppliers" />
        <div className="-mx-3 mt-6 flex snap-x gap-3 overflow-x-auto px-3 pb-3 sm:-mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
          {loading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 min-w-[75vw] animate-pulse rounded-2xl border border-slate-200 bg-white sm:min-w-0" />) : error ? <div className="col-span-full w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">Supplier profiles are temporarily unavailable.</div> : suppliers.length > 0 ? suppliers.slice(0, 4).map((supplier) => <div key={supplier.id} className="min-w-[75vw] snap-start sm:min-w-0"><SupplierCard supplier={supplier} /></div>) : <div className="col-span-full w-full rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="storefront" /></span><h3 className="mt-4 font-bold text-slate-950">Supplier profiles are coming soon</h3><p className="mt-2 text-sm text-slate-600">Businesses joining the Bazara supplier network will appear here.</p></div>}
        </div>
      </div>
    </section>
  );
}
