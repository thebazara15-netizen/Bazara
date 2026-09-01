"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MarketplaceFooter from "../../components/marketplace/MarketplaceFooter";
import SupplierCard from "../../components/marketplace/supplier/SupplierCard";
import { SupplierDirectoryEmpty, SupplierDirectoryError, SupplierDirectorySkeleton } from "../../components/marketplace/supplier/SupplierDirectoryState";
import Icon from "../../components/marketplace/Icons";

const API = "/api";

function DirectorySearch({ query, onSearch }) {
  const [value, setValue] = useState(query);
  return <form role="search" onSubmit={(event) => { event.preventDefault(); onSearch(value.trim()); }} className="mt-6 flex max-w-2xl overflow-hidden rounded-xl border-2 border-slate-900 bg-white focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-100"><label htmlFor="supplier-search" className="sr-only">Search suppliers</label><input id="supplier-search" type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search company, supplier name, or location" className="min-w-0 flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400" /><button type="submit" aria-label="Search suppliers" className="inline-flex w-14 items-center justify-center bg-slate-950 text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"><Icon name="search" /></button></form>;
}

function SuppliersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSuppliers = async () => {
      setLoading(true);
      setError(false);
      try {
        const url = query ? `${API}/suppliers?q=${encodeURIComponent(query)}` : `${API}/suppliers`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Supplier request failed");
        const data = await response.json();
        if (!cancelled) setSuppliers(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setSuppliers([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSuppliers();
    return () => { cancelled = true; };
  }, [query]);

  const search = (value) => router.push(value ? `/suppliers?q=${encodeURIComponent(value)}` : "/suppliers");

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white"><div className="marketplace-container py-10 sm:py-12"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="marketplace-eyebrow">Supplier directory</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Find businesses ready to supply</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Discover company storefronts, locations, categories, and real product catalogs across the Bazara marketplace.</p></div><Link href="/rfq" className="marketplace-button-secondary shrink-0">Post a requirement</Link></div><DirectorySearch key={query} query={query} onSearch={search} /></div></section>

      <section className="marketplace-container py-10 sm:py-12" aria-labelledby="supplier-results-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="marketplace-eyebrow">Company storefronts</p><h2 id="supplier-results-title" className="mt-2 text-2xl font-bold text-slate-950">{query ? `Results for “${query}”` : "Marketplace suppliers"}</h2></div>{!loading && !error && <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"><strong className="text-slate-950">{suppliers.length}</strong> supplier{suppliers.length === 1 ? "" : "s"}</p>}</div>
        {loading ? <SupplierDirectorySkeleton /> : error ? <SupplierDirectoryError /> : suppliers.length === 0 ? <SupplierDirectoryEmpty query={query} onClear={() => search("")} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{suppliers.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />)}</div>}
      </section>
      <MarketplaceFooter />
    </main>
  );
}

export default function SuppliersPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50"><div className="marketplace-container py-10"><SupplierDirectorySkeleton /></div></main>}><SuppliersContent /></Suspense>;
}
