"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketplaceFooter from "../../components/marketplace/MarketplaceFooter";
import ProductGrid from "../../components/marketplace/ProductGrid";
import ActiveFilterChips from "../../components/marketplace/discovery/ActiveFilterChips";
import DiscoveryEmptyState from "../../components/marketplace/discovery/DiscoveryEmptyState";
import DiscoveryPagination from "../../components/marketplace/discovery/DiscoveryPagination";
import DiscoveryToolbar from "../../components/marketplace/discovery/DiscoveryToolbar";
import { DesktopProductFilters, MobileProductFilters } from "../../components/marketplace/discovery/ProductFilters";
import Icon from "../../components/marketplace/Icons";
import { decodeToken, getToken } from "../../utils/auth";

const API = "/api";
const PAGE_SIZE = 12;
const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;

function ResultsSearch({ initialQuery, onSearch }) {
  const [value, setValue] = useState(initialQuery);
  return <form onSubmit={(event) => { event.preventDefault(); onSearch(value.trim()); }} role="search" className="mt-6 flex max-w-2xl overflow-hidden rounded-xl border-2 border-slate-900 bg-white focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-100"><label htmlFor="results-search" className="sr-only">Search marketplace products</label><input id="results-search" type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search products and categories" className="min-w-0 flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400" /><button type="submit" className="inline-flex w-14 items-center justify-center bg-slate-950 text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white" aria-label="Search"><Icon name="search" /></button></form>;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const maxMoq = searchParams.get("maxMoq") || "";
  const filters = {
    category,
    minPrice,
    maxPrice,
    maxMoq,
  };
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const viewerRole = token ? decodeToken(token)?.role || null : null;
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMessage, setFilterMessage] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cartProducts, setCartProducts] = useState(new Set());
  const [toast, setToast] = useState(null);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const filterKey = Object.values(filters).join("|");

  const navigate = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.delete("page");
    const value = next.toString();
    router.push(value ? `/products?${value}` : "/products");
  };

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      const apiQuery = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (query) apiQuery.set("search", query);
      if (category) apiQuery.set("category", category);
      if (minPrice) apiQuery.set("minPrice", minPrice);
      if (maxPrice) apiQuery.set("maxPrice", maxPrice);
      if (maxMoq) apiQuery.set("maxMoq", maxMoq);
      try {
        const response = await fetch(`${API}/products?${apiQuery.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Products request failed");
        if (cancelled) return;
        const items = Array.isArray(data?.products) ? data.products : [];
        const count = Number(data?.total) || 0;
        setProducts(items);
        setTotal(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      } catch (requestError) {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
          setError(requestError.message || "Products could not be loaded");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, [category, maxMoq, maxPrice, minPrice, page, query, sort]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/products/meta/categories`).then((response) => response.ok ? response.json() : []).then((data) => { if (!cancelled) setCategories(Array.isArray(data) ? data : []); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token || viewerRole !== "CLIENT") return;
    let cancelled = false;
    fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : []).then((items) => { if (!cancelled && Array.isArray(items)) setCartProducts(new Set(items.map((item) => item.productId))); }).catch(() => {});
    return () => { cancelled = true; };
  }, [token, viewerRole]);

  const applyFilters = (values) => {
    const numericValues = [values.minPrice, values.maxPrice, values.maxMoq].filter((value) => value !== "").map(Number);
    if (numericValues.some((value) => !Number.isFinite(value) || value < 0) || (values.maxMoq !== "" && Number(values.maxMoq) < 1) || (values.minPrice !== "" && values.maxPrice !== "" && Number(values.minPrice) > Number(values.maxPrice))) {
      setFilterMessage("Enter valid positive filters and ensure minimum price does not exceed maximum price.");
      return;
    }
    setFilterMessage("");
    navigate(values);
  };

  const clearDiscovery = () => router.push("/products");
  const removeFilter = (key) => navigate({ [key]: "" });

  const addToCart = async (product) => {
    if (!token || viewerRole !== "CLIENT") return router.push("/login");
    try {
      const response = await fetch(`${API}/cart`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: product.id, quantity: Math.max(1, Number(product.moq) || 1) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to add product");
      setCartProducts((current) => new Set([...current, product.id]));
      window.dispatchEvent(new Event("cart:changed"));
      setToast({ type: "success", message: "Product added to cart." });
    } catch (cartError) {
      setToast({ type: "error", message: cartError.message || "Product could not be added." });
    }
    window.setTimeout(() => setToast(null), 5000);
  };

  const filterProps = { values: filters, categories, onApply: applyFilters, onClear: () => navigate({ category: "", minPrice: "", maxPrice: "", maxMoq: "" }) };
  const heading = query ? `Products for “${query}”` : filters.category ? filters.category : "Explore marketplace products";

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white"><div className="marketplace-container py-8 sm:py-10"><p className="marketplace-eyebrow">Product discovery</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{heading}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Search and refine real supplier listings by category, public price, minimum order quantity, and sort order.</p><ResultsSearch key={query} initialQuery={query} onSearch={(value) => navigate({ q: value })} /></div></section>

      <div className="marketplace-container py-7 sm:py-9">
        <ActiveFilterChips filters={filters} onRemove={removeFilter} onClear={() => navigate({ category: "", minPrice: "", maxPrice: "", maxMoq: "" })} />
        {filterMessage && <div role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{filterMessage}</div>}
        <div className="mt-5 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          <DesktopProductFilters key={`desktop-${filterKey}`} {...filterProps} />
          <section className="min-w-0" aria-label="Product results">
            <DiscoveryToolbar total={total} loading={loading} sort={sort} onSort={(value) => navigate({ sort: value })} onOpenFilters={() => setMobileFiltersOpen(true)} activeFilterCount={activeFilterCount} />
            <div className="mt-5">{!loading && !error && products.length === 0 ? <DiscoveryEmptyState query={query} hasFilters={activeFilterCount > 0} onClear={clearDiscovery} /> : <ProductGrid products={products} loading={loading} error={Boolean(error)} searchQuery={query || (activeFilterCount > 0 ? "filtered" : "")} viewerRole={viewerRole} cartProducts={cartProducts} onAddToCart={addToCart} onClear={clearDiscovery} />}</div>
            {error && <p className="mt-3 text-center text-xs text-rose-700">{error}</p>}
            {!loading && !error && <DiscoveryPagination page={Math.min(page, totalPages)} totalPages={totalPages} onPage={(nextPage) => navigate({ page: nextPage }, false)} />}
          </section>
        </div>
      </div>

      <MobileProductFilters key={`mobile-${filterKey}`} open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} {...filterProps} />
      <MarketplaceFooter />
      {toast && <div role="status" className={`fixed bottom-5 left-1/2 z-[80] w-[min(92vw,390px)] -translate-x-1/2 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl ${toast.type === "error" ? "bg-rose-800" : "bg-slate-950"}`}>{toast.message}</div>}
    </main>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50"><div className="marketplace-container py-10"><div className="h-40 animate-pulse rounded-3xl bg-slate-200" /></div></main>}><ProductsContent /></Suspense>;
}
