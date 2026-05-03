"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeToken, getToken } from "../../../utils/auth";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const token = getToken();
  const viewerRole = token ? decodeToken(token)?.role : null;

  const showToast = (message, actionLabel, action) => {
    setToast({ message, actionLabel, action });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await fetch(`${API}/api/products`, { headers });
        const products = await res.json();

        const found = products.find(p => p.id === Number(productId));
        if (found) {
          setProduct(found);
          setQuantity(found.moq || 1);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, API, token]);

  const addToCart = async () => {
    if (!token) {
      showToast("Please login first", "LOGIN", () => router.push("/login"));
      return;
    }

    const user = decodeToken(token);
    if (!user || user.role !== "CLIENT") {
      showToast("Only client accounts can place orders", "OK", () => setToast(null));
      return;
    }

    try {
      const res = await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: Number(quantity)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Error adding to cart", "OK", () => setToast(null));
        return;
      }

      window.dispatchEvent(new Event("cart:changed"));
      showToast("Item added to cart", "GO TO CART", () => router.push("/cart"));
    } catch (error) {
      console.error(error);
      showToast("Error adding to cart", "OK", () => setToast(null));
    }
  };

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1422] px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-lg border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-300">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0d1422] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <p className="mb-6 text-sm font-semibold text-slate-300">Product not found</p>
          <Link
            href="/#featured-products"
            className="inline-flex rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const activeImage = images[currentImageIndex] || "/industrial.jpg";
  const moq = Number(product.moq || 1);
  const stock = Number(product.stock || 0);
  const estimatedTotal = Number(product.finalPrice || 0) * Number(quantity || 0);

  return (
    <main className="min-h-screen bg-[#0d1422] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <Link
          href="/#featured-products"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-sky-300 transition hover:border-sky-400/50 hover:bg-sky-400/10"
        >
          <span aria-hidden="true">←</span>
          Back to Products
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:p-5">
            <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-lg bg-white md:h-[420px]">
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain p-4"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous product image"
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gray-950/70 text-lg font-bold text-white transition hover:bg-orange-600"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next product image"
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gray-950/70 text-lg font-bold text-white transition hover:bg-orange-600"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-white transition ${
                      idx === currentImageIndex
                        ? "border-orange-500 ring-2 ring-orange-500/40"
                        : "border-white/10 hover:border-white/40"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">MOQ</p>
                <p className="mt-1 text-sm font-bold">{moq}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Stock</p>
                <p className="mt-1 text-sm font-bold">{stock}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Vendor</p>
                <p className="mt-1 text-sm font-bold">Verified</p>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] md:p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Ready to ship</span>
                <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300">Bulk pricing</span>
                <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">Secure order</span>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-tight text-white md:text-3xl">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                <span>Category: <span className="font-semibold text-white">{product.category || "Not specified"}</span></span>
                <span className="text-amber-300">4.5 rating</span>
                <span>123 reviews</span>
              </div>

              <div className="mt-5 rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-red-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-100/80">Client price</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-extrabold text-orange-300">{formatPrice(product.finalPrice)}</p>
                    <p className="mt-1 text-sm text-slate-300">Vendor price: {formatPrice(product.basePrice)}</p>
                  </div>
                  <p className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    Buyer price
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">Price by Quantity</h2>
                <span className="text-xs font-semibold text-slate-400">Best value at higher volume</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["2 - 99 pieces", product.basePrice],
                  ["100 - 999 pieces", product.basePrice * 0.95],
                  ["1,000 - 9,999 pieces", product.basePrice * 0.9],
                  [">= 10,000 pieces", product.basePrice * 0.85]
                ].map(([label, price]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-[#172234] px-4 py-3 transition hover:border-orange-400/50">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 text-base font-bold">{formatPrice(price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
                <h2 className="text-base font-bold">Quantity</h2>
                <div className="mt-4 flex items-center rounded-full border border-white/10 bg-[#172234] p-1">
                  <button
                    onClick={() => setQuantity(Math.max(moq, quantity - moq))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition hover:bg-white/10"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(moq, Number(e.target.value) || moq))}
                    min={moq}
                    className="min-w-0 flex-1 bg-transparent text-center text-base font-bold text-white outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + moq)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Minimum order</span>
                  <span className="font-semibold">{moq} units</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estimated item total</span>
                  <span className="font-bold text-orange-300">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
                <h2 className="text-base font-bold">Delivery</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Method</span>
                    <span className="font-semibold">Standard freight</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Estimate</span>
                    <span className="font-semibold">14 - 28 days</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Protection</span>
                    <span className="font-semibold text-emerald-300">Included</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <h2 className="text-base font-bold">Product Details</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {product.description || "No description provided."}
              </p>
            </div>

            <div className="sticky bottom-4 z-20 rounded-lg border border-white/10 bg-[#111a2a]/95 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur md:static md:bg-transparent md:p-0 md:shadow-none">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={addToCart}
                  className="flex-1 rounded-full bg-orange-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                >
                  Add to Cart
                </button>
                {token && viewerRole === "CLIENT" && (
                  <button className="flex-1 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-extrabold text-white transition hover:border-sky-400/50 hover:bg-sky-400/10">
                    Chat Now
                  </button>
                )}
                <button
                  onClick={() => router.push("/cart")}
                  className="flex-1 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-extrabold text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
                >
                  Go to Cart
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-white/10 bg-[#111a2a] p-4 shadow-xl">
          <p className="mb-3 text-sm font-semibold text-white">{toast.message}</p>
          <button
            onClick={toast.action}
            className="text-sm font-bold text-orange-300 transition hover:text-orange-200"
          >
            {toast.actionLabel} →
          </button>
        </div>
      )}
    </main>
  );
}
