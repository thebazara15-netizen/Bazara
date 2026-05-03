"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatCompactPrice = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const getToken = () => {
    if (typeof document === "undefined") return null;

    return document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
  };

  const normalizeImage = (image) => {
    if (!image) return "/industrial.jpg";
    if (String(image).startsWith("http") || String(image).startsWith("/")) return image;
    return `${API}/uploads/${image}`;
  };

  const getProductImage = (product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return normalizeImage(product.images[0]);
    }

    return normalizeImage(product?.image);
  };

  const handleImageFallback = (event) => {
    event.currentTarget.src = "/industrial.jpg";
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      localStorage.setItem("redirect", "/cart");
      router.push("/login");
      return;
    }

    fetchCart(token);
  }, []);

  const fetchCart = async (token) => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to load cart");
        return;
      }

      const items = Array.isArray(data) ? data : [];

      const normalizedItems = items.map((item) => {
        const quantity = Number(item?.quantity || 0);
        const linePrice = Number(item?.price || 0);
        const fallbackUnitPrice = quantity > 0 ? linePrice / quantity : 0;

        return {
          ...item,
          quantity,
          price: linePrice,
          product: {
            name: item?.product?.name || "Product unavailable",
            finalPrice: Number(
              item?.product?.finalPrice ??
                item?.product?.basePrice ??
                fallbackUnitPrice
            ),
            ...item?.product
          }
        };
      });

      setCart(normalizedItems);
      setSelectedIds(normalizedItems.map((item) => item.id));
      window.dispatchEvent(new Event("cart:changed"));
    } catch (error) {
      console.error(error);
      alert("Error loading cart");
    } finally {
      setLoading(false);
    }
  };

  const getUnitPrice = (item) => {
    const productPrice = Number(item?.product?.finalPrice ?? item?.product?.basePrice);

    if (Number.isFinite(productPrice)) {
      return productPrice;
    }

    const linePrice = Number(item?.price);
    const quantity = Number(item?.quantity);

    if (Number.isFinite(linePrice) && Number.isFinite(quantity) && quantity > 0) {
      return linePrice / quantity;
    }

    return 0;
  };

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedIds.includes(item.id)),
    [cart, selectedIds]
  );

  const itemSubtotal = selectedItems.reduce((sum, item) => sum + Number(item?.price || 0), 0);
  const shippingFee = selectedItems.length > 0 ? Math.max(250, itemSubtotal * 0.03) : 0;
  const grandTotal = itemSubtotal + shippingFee;
  const totalQuantity = selectedItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  const allSelected = cart.length > 0 && selectedIds.length === cart.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : cart.map((item) => item.id));
  };

  const toggleItem = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const updateQuantity = async (cartId, quantity) => {
    if (quantity <= 0) return;

    const token = getToken();

    try {
      setUpdatingId(cartId);

      const res = await fetch(`${API}/api/cart/${cartId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to update quantity");
        return;
      }

      fetchCart(token);
    } catch (error) {
      console.error(error);
      alert("Error updating cart");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (cartId) => {
    const token = getToken();

    try {
      const res = await fetch(`${API}/api/cart/${cartId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to remove item");
        return;
      }

      fetchCart(token);
    } catch (error) {
      console.error(error);
      alert("Error removing item");
    }
  };

  const goToCheckout = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one cart item");
      return;
    }

    if (selectedIds.length !== cart.length) {
      alert("Checkout currently places all cart items. Please select all items before checkout.");
      return;
    }

    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/#featured-products")}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-500 hover:text-orange-600"
            >
              <span aria-hidden="true">←</span>
              Back to dashboard
            </button>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Shopping cart</h1>
            <p className="mt-2 text-sm text-gray-500">
              Review product details, quantities, shipping estimate, and secure checkout.
            </p>
          </div>

          <button
            onClick={() => router.push("/#featured-products")}
            className="rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            Continue shopping
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-600">Loading cart...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">Add products from the client dashboard to start an order.</p>
            <button
              onClick={() => router.push("/#featured-products")}
              className="mt-6 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Browse products
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0">
              <div className="mb-5 flex items-center gap-4">
                <button
                  onClick={toggleAll}
                  aria-label="Select all cart items"
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-lg font-bold transition ${
                    allSelected
                      ? "border-gray-950 bg-gray-950 text-white"
                      : "border-gray-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </button>
                <p className="text-lg font-bold">
                  Select all variations ({totalQuantity || cart.reduce((sum, item) => sum + item.quantity, 0)})
                </p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-6">
                {cart.map((item) => {
                  const product = item.product || {};
                  const unitPrice = getUnitPrice(item);
                  const step = Math.max(1, Number(product.moq || 1));
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <article key={item.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                      <button
                        onClick={() => toggleItem(item.id)}
                        aria-label={`Select ${product.name}`}
                        className={`mt-32 flex h-8 w-8 items-center justify-center rounded-md border text-lg font-bold transition sm:mt-28 ${
                          isSelected
                            ? "border-gray-950 bg-gray-950 text-white"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </button>

                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-950">Verified industrial supplier</p>
                              <p className="text-xs text-gray-500">Vendor ID: {product.vendorId || "Assigned after quote"}</p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="self-start rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 sm:self-auto"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6">
                          <div className="mb-4">
                            <h2 className="text-lg font-bold leading-snug md:text-xl">{product.name}</h2>
                            <p className="mt-2 text-sm text-gray-500">
                              {product.description || "Industrial B2B product configured for bulk purchasing."}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                              <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Lowest among similar</span>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Ready to ship</span>
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                                MOQ: {product.moq || 1} pieces
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-[150px_minmax(0,1fr)_320px] md:items-center">
                            <div className="flex h-36 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white md:h-32">
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                onError={handleImageFallback}
                                className="h-full w-full object-contain p-2"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold">Selected variation</p>
                              <p className="mt-1 text-sm text-gray-600">
                                Category: {product.category || "Industrial supplies"}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                Stock available: {product.stock ?? "Contact supplier"}
                              </p>
                              <p className="mt-3 text-sm text-gray-500">
                                Estimated delivery: 10 Jul-21 Aug
                              </p>
                            </div>

                            <div className="flex flex-col gap-4 md:items-end">
                              <div className="text-left md:text-right">
                                <p className="text-lg font-bold">{formatCompactPrice(unitPrice)} <span className="text-sm font-medium text-gray-500">/piece</span></p>
                                <p className="mt-1 text-sm text-gray-500">Line total: {formatPrice(item.price)}</p>
                              </div>

                              <div className="flex h-12 w-full max-w-[190px] items-center justify-between rounded-full border border-gray-200 bg-white px-2">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - step))}
                                  disabled={updatingId === item.id}
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span className="min-w-12 text-center text-base font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + step)}
                                  disabled={updatingId === item.id}
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
                <h2 className="text-xl font-bold">Order summary ({totalQuantity} items)</h2>

                <div className="mt-6 grid grid-cols-4 gap-3">
                  {selectedItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm"
                    >
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product?.name || "Cart item"}
                        onError={handleImageFallback}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  ))}
                  {selectedItems.length > 5 && (
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white shadow-sm">
                      +{selectedItems.length - 5}
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Item subtotal</span>
                    <span className="font-bold">{formatCompactPrice(itemSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shipping fee</span>
                    <span className="font-bold">{formatCompactPrice(shippingFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-bold">Subtotal excl. tax</span>
                      <span className="font-extrabold">{formatCompactPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={goToCheckout}
                  disabled={cart.length === 0 || selectedIds.length === 0}
                  className="mt-8 w-full rounded-full bg-orange-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  Check out
                </button>

                <div className="mt-8 space-y-5 border-t border-gray-100 pt-6">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">Bazara order protection</h3>
                      <span className="text-xl">›</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Secure checkout with encrypted order processing and support for bulk B2B purchases.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold">Guaranteed delivery</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Track supplier fulfillment, estimated shipping, and order confirmation from your account.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
