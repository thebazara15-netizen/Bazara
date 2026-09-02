import Icon from "./Icons";
import SectionHeader from "./SectionHeader";
import SupplierCard from "./supplier/SupplierCard";

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
