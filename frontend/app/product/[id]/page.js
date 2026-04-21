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

  // Show toast notification
  const showToast = (message, actionLabel, action) => {
    setToast({ message, actionLabel, action });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch product details
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

  // Add to cart
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

      showToast("Item added to cart!", "GO TO CART", () => router.push("/cart"));
    } catch (error) {
      console.error(error);
      showToast("Error adding to cart", "OK", () => setToast(null));
    }
  };

  // Image navigation
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-400 mb-6">Product not found</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition"
        >
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4 h-96 md:h-[500px] flex items-center justify-center group">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Image Navigation */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition text-xl"
                      >
                        ◀
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition text-xl"
                      >
                        ▶
                      </button>
                    </>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-2xl">📷 No Image</span>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      idx === currentImageIndex
                        ? "border-orange-500 ring-2 ring-orange-500/50"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{product.name}</h1>
              <p className="text-gray-400 text-sm">Category: {product.category || "Not specified"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-400 text-lg">⭐ 4.5 (123 reviews)</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-2">Base Price (Vendor Price)</p>
              <p className="text-3xl font-bold text-orange-400">{formatPrice(product.basePrice)}</p>
              <p className="text-gray-400 text-sm mt-2">Client Price: <span className="text-green-400 font-semibold">{formatPrice(product.finalPrice)}</span></p>
            </div>

            {/* Price Tiers */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💰 Price by Quantity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-xs">2 - 99 pieces</p>
                  <p className="text-white font-bold">{formatPrice(product.basePrice)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-xs">100 - 999 pieces</p>
                  <p className="text-white font-bold">{formatPrice(product.basePrice * 0.95)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-xs">1,000 - 9,999 pieces</p>
                  <p className="text-white font-bold">{formatPrice(product.basePrice * 0.90)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-xs">≥ 10,000 pieces</p>
                  <p className="text-white font-bold">{formatPrice(product.basePrice * 0.85)}</p>
                </div>
              </div>
            </div>

            {/* Quantity Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📦 Quantity</h3>
              <div className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <button
                  onClick={() => setQuantity(Math.max(product.moq || 1, quantity - (product.moq || 1)))}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.moq || 1, Number(e.target.value)))}
                  min={product.moq || 1}
                  className="flex-1 bg-gray-800 border border-gray-600 text-white text-center py-2 rounded-lg focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => setQuantity(quantity + (product.moq || 1))}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition font-bold"
                >
                  +
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">Minimum order: {product.moq || 1} units</p>
            </div>

            {/* Stock & MOQ */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <p className="text-gray-400 text-xs">Stock Available</p>
                <p className="text-white font-bold text-lg">{product.stock || 0} units</p>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <p className="text-gray-400 text-xs">Minimum Order</p>
                <p className="text-white font-bold text-lg">{product.moq || 1} units</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-2">📝 Description</h3>
              <p className="text-gray-300 leading-relaxed">{product.description || "No description provided"}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={addToCart}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-lg font-bold transition"
              >
                🛒 Add to Cart
              </button>
              {token && viewerRole === "CLIENT" && (
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-bold transition">
                  💬 Chat Now
                </button>
              )}
            </div>

            {/* Shipping Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">🚚 Shipping</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-blue-400">Standard Shipping:</span> Alibaba.com Logistics
                </p>
                <p className="text-gray-300">
                  <span className="text-blue-400">Estimated Delivery:</span> 14 - 28 days
                </p>
                <p className="text-gray-400 text-xs">
                  Please reach out to us to get the lowest shipping cost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-4 z-50">
          <p className="text-white mb-3">{toast.message}</p>
          <button
            onClick={toast.action}
            className="text-orange-400 hover:text-orange-300 font-semibold transition"
          >
            {toast.actionLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
