"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { decodeToken, getToken } from "../utils/auth";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim();

  const [products, setProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [cartProducts, setCartProducts] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const viewerRole = decodeToken(getToken())?.role || null;
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const showToast = (message, actionLabel, action) => {
    setToast({ message, actionLabel, action });
    setTimeout(() => setToast(null), 5000);
  };

  const addToCart = async (product) => {
    const token = getToken();
    const user = token ? decodeToken(token) : null;

    if (!token) {
      showToast("Please login first", "LOGIN", () => router.push("/login"));
      return;
    }

    if (!user || user.role !== "CLIENT") {
      showToast("Only client accounts can place orders", "DISMISS", () => setToast(null));
      return;
    }

    try {
      const res = await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: Number(product.moq) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Error adding to cart", "DISMISS", () => setToast(null));
        return;
      }

      setCartProducts((prev) => new Set([...prev, product.id]));
      window.dispatchEvent(new Event("cart:changed"));
      showToast("Item added to cart", "GO TO CART", () => router.push("/cart"));
    } catch (err) {
      console.error(err);
      showToast("Error adding to cart", "DISMISS", () => setToast(null));
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(searchQuery ? { search: searchQuery } : {}),
        });

        const res = await fetch(`${API}/api/products?${query.toString()}`, {
          headers,
        });
        const data = await res.json();

        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalProducts(data.total || 0);
        } else {
          setProducts(Array.isArray(data) ? data : []);
          setTotalProducts(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error(err);
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchCartProducts = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch(`${API}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const cartItems = await res.json();
        if (Array.isArray(cartItems)) {
          const productIds = new Set(cartItems.map((item) => item.productId));
          setCartProducts(productIds);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };

    loadProducts();
    fetchCartProducts();
  }, [API, page, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                Industrial sourcing
              </p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Buy bulk industrial supplies from trusted vendors.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Discover verified products, compare MOQ pricing, and manage large orders with a modern B2B marketplace built for industrial buyers and suppliers.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => router.push("/product")}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
                >
                  Browse Products
                </button>
                <button
                  onClick={() => router.push("/rfq")}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Request a Quote
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Trusted vendors</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">120+</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Vetted suppliers across manufacturing, parts, and materials.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Bulk pricing</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">MOQ-ready</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Instant pricing for minimum order quantity and volume tiers.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Featured products</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">Bulk-ready industrial supplies</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
              {totalProducts} product{totalProducts === 1 ? "" : "s"} available
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading && products.length === 0 ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
                  <div className="h-48 rounded-3xl bg-slate-200" />
                  <div className="mt-5 space-y-4">
                    <div className="h-5 w-3/4 rounded-full bg-slate-200" />
                    <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="h-12 rounded-2xl bg-slate-200" />
                      <div className="h-12 rounded-2xl bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">No products match your search.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Try a broader keyword, or explore products from another category.</p>
              </div>
            ) : (
              products.map((product) => {
                const images = product.images || [];
                const currentIdx = currentImageIndex[product.id] || 0;
                const currentImage = images[currentIdx] || "/industrial.jpg";

                const rotateImage = (direction) => {
                  if (!images.length) return;
                  setCurrentImageIndex((prev) => ({
                    ...prev,
                    [product.id]:
                      direction === "next"
                        ? (currentIdx + 1) % images.length
                        : (currentIdx - 1 + images.length) % images.length,
                  }));
                };

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300"
                      />
                      {images.length > 1 && (
                        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentImageIndex((prev) => ({ ...prev, [product.id]: idx }));
                              }}
                              className={`h-2.5 w-2.5 rounded-full ${idx === currentIdx ? "bg-blue-600" : "bg-white/80"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        <span>{product.category || "Industrial"}</span>
                        <span>{product.stock ? `${product.stock} in stock` : "Stock clear"}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-2">
                          {product.description || product.category || "Premium industrial supplies for B2B bulk orders."}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">MOQ</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{product.moq || 1}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
                          <p className="mt-2 text-lg font-semibold text-blue-600">{formatPrice(product.finalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5">
                      {viewerRole === "CLIENT" ? (
                        cartProducts.has(product.id) ? (
                          <button
                            onClick={() => router.push("/cart")}
                            className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                          >
                            Go to Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Add to Cart
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => router.push("/login")}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                          Login to Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalProducts > limit && (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm shadow-slate-200">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${page === 1 ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {page} of {Math.ceil(totalProducts / limit)}</span>
                <button
                  onClick={() => setPage((current) => Math.min(Math.ceil(totalProducts / limit), current + 1))}
                  disabled={page === Math.ceil(totalProducts / limit)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${page === Math.ceil(totalProducts / limit) ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={toast.action}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {toast.actionLabel}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <HomeContent />
    </Suspense>
  );
}
