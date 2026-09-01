"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MarketplaceFooter from "../../../components/marketplace/MarketplaceFooter";
import ProductGrid from "../../../components/marketplace/ProductGrid";
import DiscoveryPagination from "../../../components/marketplace/discovery/DiscoveryPagination";
import Icon from "../../../components/marketplace/Icons";
import { getSupplierName } from "../../../components/marketplace/supplier/SupplierCard";
import { SupplierProfileLoading, SupplierProfileUnavailable } from "../../../components/marketplace/supplier/SupplierProfileState";

const API = "/api";
const PAGE_SIZE = 12;
const EMPTY_CART = new Set();

function CatalogSearch({ query, onSearch }) {
  const [value, setValue] = useState(query);
  return <form role="search" onSubmit={(event) => { event.preventDefault(); onSearch(value.trim()); }} className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-100"><label htmlFor="supplier-catalog-search" className="sr-only">Search this supplier&apos;s products</label><input id="supplier-catalog-search" type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search this supplier's products" className="min-w-0 flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400" /><button type="submit" aria-label="Search supplier products" className="inline-flex w-12 items-center justify-center bg-slate-950 text-white hover:bg-orange-700"><Icon name="search" /></button></form>;
}

export default function SupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSupplierId = Array.isArray(params.id) ? params.id[0] : params.id;
  const supplierId = Number(rawSupplierId);
  const invalidSupplierId = !Number.isInteger(supplierId) || supplierId <= 0;
  const query = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const [supplier, setSupplier] = useState(null);
  const [profileState, setProfileState] = useState("loading");
  const [products, setProducts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const totalPages = Math.max(1, Math.ceil(productTotal / PAGE_SIZE));

  const navigateCatalog = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, String(value)) : next.delete(key));
    if (resetPage) next.delete("page");
    const value = next.toString();
    router.push(value ? `/suppliers/${supplierId}?${value}#supplier-products` : `/suppliers/${supplierId}#supplier-products`);
  };

  useEffect(() => {
    if (invalidSupplierId) return;
    let cancelled = false;
    fetch(`${API}/suppliers/${supplierId}`)
      .then((response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Supplier request failed");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!data) setProfileState("not-found");
        else {
          setSupplier(data);
          setProfileState("ready");
        }
      })
      .catch(() => { if (!cancelled) setProfileState("error"); });
    return () => { cancelled = true; };
  }, [invalidSupplierId, supplierId]);

  useEffect(() => {
    if (invalidSupplierId) return;
    let cancelled = false;
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(false);
      const apiQuery = new URLSearchParams({ vendorId: String(supplierId), page: String(page), limit: String(PAGE_SIZE) });
      if (query) apiQuery.set("search", query);
      if (category) apiQuery.set("category", category);
      try {
        const response = await fetch(`${API}/products?${apiQuery.toString()}`);
        if (!response.ok) throw new Error("Products request failed");
        const data = await response.json();
        if (!cancelled) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
          setProductTotal(Number(data?.total) || 0);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setProductTotal(0);
          setProductsError(true);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, [category, invalidSupplierId, page, query, supplierId]);

  if (invalidSupplierId) return <SupplierProfileUnavailable type="invalid" />;
  if (profileState === "loading") return <SupplierProfileLoading />;
  if (profileState === "error") return <SupplierProfileUnavailable type="error" />;
  if (profileState === "not-found" || !supplier) return <SupplierProfileUnavailable type="not-found" />;

  const supplierName = getSupplierName(supplier);
  const contactName = supplier.companyName ? [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") : "";
  const hasBusinessInformation = Boolean(supplier.businessType || supplier.location || supplier.categories?.length);
  const hasCatalogFilters = Boolean(query || category);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white"><div className="marketplace-container py-8 sm:py-12"><Link href="/suppliers" className="text-sm font-bold text-orange-700 hover:text-orange-800">← Back to suppliers</Link><div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="marketplace-eyebrow">Supplier storefront</p>{supplier.isVerified === true && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><Icon name="shield" className="h-3 w-3" />Verified supplier</span>}</div><h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">{supplierName}</h1>{contactName && <p className="mt-3 text-base font-semibold text-slate-600">{contactName}</p>}<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">{supplier.businessType && <span>{supplier.businessType}</span>}{supplier.location && <span>{supplier.location}</span>}<span>{supplier.productCount ?? 0} product{supplier.productCount === 1 ? "" : "s"} listed</span></div></div><a href="#supplier-products" className="marketplace-button-primary shrink-0">Browse products</a></div><p className="mt-7 max-w-2xl rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Select a product from this storefront to review details and send a supplier enquiry.</p></div></section>

      {(supplier.aboutCompany || hasBusinessInformation) && <section className="marketplace-container py-10"><div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">{supplier.aboutCompany && <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><p className="marketplace-eyebrow">Company profile</p><h2 className="mt-2 text-xl font-bold text-slate-950">About company</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">{supplier.aboutCompany}</p></article>}{hasBusinessInformation && <article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-950">Business information</h2><dl className="mt-5 space-y-4 text-sm">{supplier.businessType && <div><dt className="text-xs text-slate-500">Business category</dt><dd className="mt-1 font-bold text-slate-800">{supplier.businessType}</dd></div>}{supplier.location && <div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-1 font-bold text-slate-800">{supplier.location}</dd></div>}{supplier.categories?.length > 0 && <div><dt className="text-xs text-slate-500">Product categories</dt><dd className="mt-2 flex flex-wrap gap-2">{supplier.categories.map((item) => <Link key={item} href={`/products?category=${encodeURIComponent(item)}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-800">{item}</Link>)}</dd></div>}</dl></article>}</div></section>}

      <section id="supplier-products" className="scroll-mt-44 border-t border-slate-200 bg-white py-10 sm:py-14"><div className="marketplace-container"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="marketplace-eyebrow">Product catalog</p><h2 className="mt-2 text-2xl font-bold text-slate-950">Products from {supplierName}</h2><p className="mt-2 text-sm text-slate-600">{productsLoading ? "Loading products…" : `${productTotal} matching product${productTotal === 1 ? "" : "s"}`}</p></div></div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row"><CatalogSearch key={query} query={query} onSearch={(value) => navigateCatalog({ q: value })} />{supplier.categories?.length > 0 && <><label htmlFor="supplier-category" className="sr-only">Filter supplier products by category</label><select id="supplier-category" value={category} onChange={(event) => navigateCatalog({ category: event.target.value })} className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"><option value="">All categories</option>{supplier.categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></>}</div>
        <div className="mt-7">{!productsLoading && !productsError && products.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center"><Icon name="package" className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-4 text-lg font-bold text-slate-950">{hasCatalogFilters ? "No products match this storefront search" : "This supplier has no listed products yet"}</h3>{hasCatalogFilters && <button type="button" onClick={() => router.push(`/suppliers/${supplierId}#supplier-products`)} className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Clear catalog filters</button>}</div> : <ProductGrid products={products} loading={productsLoading} error={productsError} searchQuery={query || category} viewerRole={null} cartProducts={EMPTY_CART} onAddToCart={() => {}} onClear={() => router.push(`/suppliers/${supplierId}#supplier-products`)} />}</div>
        {!productsLoading && !productsError && <DiscoveryPagination page={Math.min(page, totalPages)} totalPages={totalPages} onPage={(nextPage) => navigateCatalog({ page: nextPage }, false)} />}
      </div></section>
      <MarketplaceFooter />
    </main>
  );
}
