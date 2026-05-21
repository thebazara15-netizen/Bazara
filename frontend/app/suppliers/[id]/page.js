"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API = "/api";
const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function SupplierProfilePage() {
  const params = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/suppliers/${params.id}`)
      .then((res) => res.json())
      .then((data) => setSupplier(data?.id ? data : null))
      .catch(() => setSupplier(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <main className="min-h-screen bg-[#0d1422] px-4 py-12 text-white">Loading supplier...</main>;
  }

  if (!supplier) {
    return <main className="min-h-screen bg-[#0d1422] px-4 py-12 text-white">Supplier not found.</main>;
  }

  const name = supplier.companyName || `${supplier.firstName || "Supplier"} ${supplier.lastName || ""}`;

  return (
    <main className="min-h-screen bg-[#0d1422] text-white">
      <section className="border-b border-white/10 bg-white/[0.04] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/suppliers" className="mb-5 inline-flex text-sm font-bold text-sky-300">Back to suppliers</Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${supplier.isVerified ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
                  {supplier.isVerified ? "Verified Supplier" : "Verification Pending"}
                </span>
                <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">{supplier.responseRate || 80}% response rate</span>
              </div>
              <h1 className="text-3xl font-extrabold md:text-5xl">{name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{supplier.aboutCompany || "Industrial supplier on Bazara with a growing product catalog and bulk order capability."}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#172234] p-4 text-sm">
              <p><span className="text-slate-400">Location:</span> {supplier.location || "Not added"}</p>
              <p className="mt-2"><span className="text-slate-400">GST:</span> {supplier.gstNumber || "Not added"}</p>
              <p className="mt-2"><span className="text-slate-400">Products:</span> {supplier.productCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h2 className="mb-5 text-xl font-bold">Product Catalog</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(supplier.products || []).map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-orange-400/60">
              <div className="h-40 bg-white">
                <img src={product.images?.[0] || "/industrial.jpg"} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-bold line-clamp-2">{product.name}</h3>
                <p className="mt-2 text-sm font-bold text-orange-300">{formatPrice(product.finalPrice)}</p>
                <p className="mt-1 text-xs text-slate-400">MOQ: {product.moq}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
