"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API = "/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${API}/suppliers`)
      .then((res) => res.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, []);

  const visibleSuppliers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return suppliers;
    return suppliers.filter((supplier) =>
      [supplier.companyName, supplier.firstName, supplier.lastName, supplier.location, ...(supplier.categories || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, suppliers]);

  return (
    <main className="min-h-screen bg-[#0d1422] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">Verified Suppliers</h1>
            <p className="mt-2 text-sm text-slate-400">Discover vendors, storefronts, categories, and product catalogs.</p>
          </div>
          <Link href="/rfq" className="rounded-full bg-orange-600 px-5 py-3 text-sm font-bold transition hover:bg-orange-700">
            Post RFQ
          </Link>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search supplier, city, or category"
          className="mb-6 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-orange-400"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSuppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-orange-400/60 hover:bg-white/[0.07]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{supplier.companyName || `${supplier.firstName || "Supplier"} ${supplier.lastName || ""}`}</h2>
                  <p className="mt-1 text-sm text-slate-400">{supplier.location || "Location not added"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${supplier.isVerified ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
                  {supplier.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[#172234] px-3 py-2">
                  <span className="text-slate-400">Products</span>
                  <p className="font-bold">{supplier.productCount}</p>
                </div>
                <div className="rounded-md bg-[#172234] px-3 py-2">
                  <span className="text-slate-400">Response</span>
                  <p className="font-bold">{supplier.responseRate || 80}%</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(supplier.categories || []).slice(0, 4).map((category) => (
                  <span key={category} className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300">{category}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
