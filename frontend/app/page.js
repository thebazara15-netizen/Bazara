"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeToken, getToken } from "../utils/auth";
import CategorySection from "../components/marketplace/CategorySection";
import Hero from "../components/marketplace/Hero";
import MarketplaceFooter from "../components/marketplace/MarketplaceFooter";
import ProductGrid from "../components/marketplace/ProductGrid";
import RfqBanner from "../components/marketplace/RfqBanner";
import SectionHeader from "../components/marketplace/SectionHeader";
import SupplierSection from "../components/marketplace/SupplierSection";
import TrendingSection from "../components/marketplace/TrendingSection";
import VisualSearchSection from "../components/marketplace/VisualSearchSection";
import IndiaSourcingSection from "../components/marketplace/IndiaSourcingSection";
import ValueSection from "../components/marketplace/ValueSection";
import MarketplaceFeatureBanner from "../components/marketplace/MarketplaceFeatureBanner";

const API = "/api";
const PAGE_SIZE = 12;
const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim();
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const viewerRole = token ? decodeToken(token)?.role : null;
  const [pagination, setPagination] = useState({ query: "", page: 1 });
  const page = pagination.query === searchQuery ? pagination.page : 1;
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState(false);
  const [cartProducts, setCartProducts] = useState(new Set());
  const [toast, setToast] = useState(null);
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const featuredProducts = searchQuery ? products : products.slice(5);
  const showFeaturedProducts = Boolean(searchQuery || productsLoading || productsError || featuredProducts.length);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(false);
      try {
        const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (searchQuery) query.set("search", searchQuery);
        const response = await fetch(`${API}/products?${query.toString()}`);
        if (!response.ok) throw new Error("Products request failed");
        const data = await response.json();
        if (cancelled) return;
        if (Array.isArray(data?.products)) {
          setProducts(data.products);
          setTotalProducts(Number(data.total) || 0);
        } else {
          const items = Array.isArray(data) ? data : [];
          setProducts(items);
          setTotalProducts(items.length);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalProducts(0);
          setProductsError(true);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, [page, searchQuery]);

  useEffect(() => {
    if (productsLoading) return;
    const targetId = window.location.hash.slice(1);
    if (!["trending-products", "visual-search"].includes(targetId)) return;
    const frame = window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView());
    return () => window.cancelAnimationFrame(frame);
  }, [productsLoading]);

  useEffect(() => {
    let cancelled = false;
    const loadSuppliers = async () => {
      try {
        const response = await fetch(`${API}/suppliers`);
        if (!response.ok) throw new Error("Suppliers request failed");
        const data = await response.json();
        if (!cancelled) setSuppliers(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSuppliersError(true);
      } finally {
        if (!cancelled) setSuppliersLoading(false);
      }
    };
    loadSuppliers();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token || viewerRole !== "CLIENT") return;
    let cancelled = false;
    const loadCart = async () => {
      try {
        const response = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.items;
        if (!cancelled && Array.isArray(items)) setCartProducts(new Set(items.map((item) => item.productId)));
      } catch {
        // Cart availability should not block public product browsing.
      }
    };
    loadCart();
    return () => { cancelled = true; };
  }, [token, viewerRole]);

  const showToast = (message, actionLabel, action) => {
    setToast({ message, actionLabel, action });
    window.setTimeout(() => setToast(null), 5000);
  };

  const addToCart = async (product) => {
    if (!token || viewerRole !== "CLIENT") {
      showToast("Sign in with a buyer account to add products.", "Sign in", () => router.push("/login"));
      return;
    }
    try {
      const response = await fetch(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: Number(product.moq) || 1 }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.message || "This product could not be added.", "Dismiss", () => setToast(null));
      setCartProducts((current) => new Set([...current, product.id]));
      window.dispatchEvent(new Event("cart:changed"));
      showToast("Product added to cart.", "View cart", () => router.push("/cart"));
    } catch {
      showToast("This product could not be added right now.", "Dismiss", () => setToast(null));
    }
  };

  const changePage = (nextPage) => {
    setPagination({ query: searchQuery, page: nextPage });
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="marketplace-container pt-4 sm:pt-6"><Hero /><ValueSection /><CategorySection products={products} /></div>

      {!searchQuery && <MarketplaceFeatureBanner product={products[0]} />}

      {!searchQuery && <TrendingSection products={products} loading={productsLoading} error={productsError} viewerRole={viewerRole} cartProducts={cartProducts} onAddToCart={addToCart} />}

      {showFeaturedProducts && <section id="featured-products" className="scroll-mt-44 border-t border-slate-200 bg-white py-14 sm:py-16">
        <div className="marketplace-container">
          <SectionHeader
            eyebrow={searchQuery ? "Search results" : "Product marketplace"}
            title={searchQuery ? `Results for “${searchQuery}”` : "Featured products"}
            description={searchQuery ? `${totalProducts} matching product${totalProducts === 1 ? "" : "s"} found.` : "Explore products currently available from marketplace suppliers."}
          />
          <div className="mt-7"><ProductGrid products={featuredProducts} loading={productsLoading} error={productsError} searchQuery={searchQuery} viewerRole={viewerRole} cartProducts={cartProducts} onAddToCart={addToCart} onClear={() => router.push("/#featured-products")} /></div>
          {totalPages > 1 && <nav aria-label="Product pagination" className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm text-slate-600">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>}
        </div>
      </section>}

      <VisualSearchSection viewerRole={viewerRole} />
      <SupplierSection suppliers={suppliers} loading={suppliersLoading} error={suppliersError} />
      <IndiaSourcingSection viewerRole={viewerRole} />
      <RfqBanner />
      <MarketplaceFooter />

      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[60] w-[min(92vw,390px)] -translate-x-1/2 rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{toast.message}</p><button type="button" onClick={toast.action} className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{toast.actionLabel}</button></div></div>}
    </main>
  );
}

export default function Home() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50"><div className="marketplace-container py-8"><div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" /></div></main>}><HomeContent /></Suspense>;
}
