"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { decodeToken, getToken } from "../utils/auth";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function Home() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [cartProducts, setCartProducts] = useState(new Set()); // ✅ Track added to cart products
  const [toast, setToast] = useState(null); // ✅ Toast notification state
  const API = process.env.NEXT_PUBLIC_API_URL;
  const viewerRole = decodeToken(getToken())?.role || null;

  // ✅ Show toast notification
  const showToast = (message, actionLabel, action) => {
    setToast({ message, actionLabel, action });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  const addToCart = async (product) => {
    const token = getToken();
    const user = token ? decodeToken(token) : null;

    // ❌ Not logged in
    if (!token) {
      showToast("Please login first", "LOGIN", () => router.push("/login"));
      return;
    }

    if (!user || user.role !== "CLIENT") {
      showToast("Only client accounts can place orders", "DISMISS", () => setToast(null));
      return;
    }

    // ✅ Logged in
    try {
      const res = await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: Number(product.moq) || 1
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Error adding to cart", "DISMISS", () => setToast(null));
        return;
      }

      // ✅ Mark product as added to cart and show toast
      setCartProducts(prev => new Set([...prev, product.id]));
      showToast("Item added to cart", "GO TO CART", () => router.push("/cart"));
    } catch (err) {
      console.error(err);
      showToast("Error adding to cart", "DISMISS", () => setToast(null));
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = getToken();
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await fetch(`${API}/api/products`, {
          headers
        });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    // ✅ UPDATED: Fetch cart items to check which products are already added
    const fetchCartProducts = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch(`${API}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const cartItems = await res.json();
        if (Array.isArray(cartItems)) {
          const productIds = new Set(cartItems.map(item => item.productId));
          setCartProducts(productIds);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };

    loadProducts();
    fetchCartProducts(); // ✅ Check cart on page load
  }, [API]);

  return (
    <div className="min-h-screen text-white">

      {/* Navbar */}
      <div className="flex justify-between items-center px-10 py-4 bg-white text-black shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300"></div>
          <div>
            <h1 className="font-bold text-lg">ERAM INSTRUMENTS</h1>
            <p className="text-sm text-gray-600">
              Industrial IoT & Compliance
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {viewerRole === "ADMIN" && (
            <Link href="/admin">
              <button className="bg-purple-600 px-6 py-2 rounded-lg text-white hover:bg-purple-700">
                Dashboard
              </button>
            </Link>
          )}
          <Link href="/login">
            <button className="bg-orange-600 px-6 py-2 rounded-lg text-white hover:bg-orange-700">
              Login
            </button>
          </Link>

          {/* ✅ ONLY CHANGE: Register → Signup */}
          <Link href="/register">
            <button className="bg-green-600 px-6 py-2 rounded-lg text-white hover:bg-green-700">
              Signup
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="relative h-[85vh] flex flex-col justify-center items-center text-center bg-cover bg-center"
        style={{
          backgroundImage: "url('/industrial.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Industrial B2B Marketplace
          </h1>

          <p className="text-gray-300 mb-8 max-w-xl">
            Connect industries, manage bulk orders, and scale your business with our secure platform.
          </p>

          <div className="flex gap-6 justify-center">
            <Link href="/register">
              <button className="bg-orange-600 px-8 py-3 rounded-full">
                Register Industry
              </button>
            </Link>

            <Link href="/login">
              <button className="bg-green-600 px-8 py-3 rounded-full">
                Client Login
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 🔥 PRODUCT LIST SECTION */}
      <div className="bg-gray-900 text-white py-16 px-10">

        <h2 className="text-3xl font-bold mb-10 text-center">
          Explore Products
        </h2>

        <div className="grid md:grid-cols-4 gap-8">

          {products.map(product => {
            const images = product.images || [];
            const currentIdx = currentImageIndex[product.id] || 0;
            const currentImage = images[currentIdx] || "/industrial.jpg";

            const nextImage = () => {
              setCurrentImageIndex(prev => ({
                ...prev,
                [product.id]: (currentIdx + 1) % images.length
              }));
            };

            const prevImage = () => {
              setCurrentImageIndex(prev => ({
                ...prev,
                [product.id]: (currentIdx - 1 + images.length) % images.length
              }));
            };

            return (
              <div
                key={product.id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition"
              >

                {/* ✅ Image Gallery with Navigation */}
                <div className="relative h-40 bg-gray-700 overflow-hidden group">
                  <img
                    src={currentImage}
                    className="h-40 w-full object-cover"
                    alt={product.name}
                  />

                  {/* ✅ Navigation Buttons (show on hover for large screens) */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        ◀
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        ▶
                      </button>
                    </>
                  )}

                  {/* ✅ Image Counter and Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(prev => ({ ...prev, [product.id]: idx }))}
                          className={`w-2 h-2 rounded-full transition ${
                            idx === currentIdx ? "bg-orange-600" : "bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">

                  <h3 className="text-lg font-semibold">
                    {product.name}
                  </h3>

                  <p className="hidden">
                    ₹{product.finalPrice}
                  </p>

                  {viewerRole === "CLIENT" ? (
                    <p className="text-sm text-gray-300">
                      Client Price: {formatPrice(product.finalPrice)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Client pricing is visible only after client login.
                    </p>
                  )}

                  <p className="text-gray-400 text-sm">
                    MOQ: {product.moq}
                  </p>

                  {viewerRole === "CLIENT" ? (
                    cartProducts.has(product.id) ? (
                      <button
                        onClick={() => router.push("/cart")}
                        className="w-full mt-3 bg-green-600 py-2 rounded hover:bg-green-700 font-semibold"
                      >
                        Go to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full mt-3 bg-orange-600 py-2 rounded hover:bg-orange-700"
                      >
                        Add to Cart
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => router.push("/login")}
                      className="w-full mt-3 bg-orange-600 py-2 rounded hover:bg-orange-700"
                    >
                      Login as Client
                    </button>
                  )}

                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* Features Section */}
      <div className="bg-white text-black py-16 px-10">
        <div className="grid md:grid-cols-3 gap-10 text-center">

          <div>
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="font-semibold text-lg">Industrial</h2>
            <p className="text-gray-600">
              Built for industrial scale operations
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">📊</div>
            <h2 className="font-semibold text-lg">Analytics</h2>
            <p className="text-gray-600">
              Data-driven insights for growth
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">☁️</div>
            <h2 className="font-semibold text-lg">Cloud</h2>
            <p className="text-gray-600">
              24×7 availability with cloud support
            </p>
          </div>

        </div>
      </div>

      {/* Trusted Section */}
      <div className="py-16 text-center bg-gray-100 text-black">
        <h2 className="text-2xl font-bold">
          Trusted by Industries & Compliance Teams
        </h2>
      </div>

      {/* ✅ Toast Notification */}
      {toast && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white py-4 px-6 flex items-center justify-between shadow-lg z-50">
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={toast.action}
            className="ml-4 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold text-sm whitespace-nowrap"
          >
            {toast.actionLabel}
          </button>
        </div>
      )}

    </div>
  );
}
