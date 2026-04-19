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

      {/* Hero Section */}
      <div
        className="relative min-h-[90vh] flex flex-col justify-center items-center text-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/industrial.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Industrial B2B Marketplace
          </h1>

          <p className="text-gray-200 mb-10 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Connect with vetted vendors, manage bulk orders with precision, and scale your industrial business on our secure, enterprise-grade platform.
          </p>

          <div className="flex gap-6 justify-center flex-wrap">
            <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:scale-105">
              Get Started
            </button>
            <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-bold text-lg transition backdrop-blur-sm">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 PRODUCT LIST SECTION */}
      <div className="bg-gradient-to-b from-gray-900 to-black text-white py-20 px-10">

        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Featured Products</h2>
          <p className="text-gray-400 text-center mb-12">Discover quality products from verified vendors</p>

          <div className="grid md:grid-cols-4 gap-6">

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
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 border border-gray-700 hover:border-orange-500"
              >

                {/* ✅ Image Gallery with Navigation */}
                <div className="relative h-48 bg-gray-700 overflow-hidden group">
                  <img
                    src={currentImage}
                    className="h-48 w-full object-cover"
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

                <div className="p-5">

                  <h3 className="text-lg font-bold mb-2 text-white line-clamp-2">
                    {product.name}
                  </h3>

                  <p className="text-sm text-orange-400 font-semibold mb-2">
                    {formatPrice(product.finalPrice)}
                  </p>

                  <p className="text-gray-400 text-xs mb-4">
                    MOQ: {product.moq}
                  </p>

                  {viewerRole === "CLIENT" ? (
                    cartProducts.has(product.id) ? (
                      <button
                        onClick={() => router.push("/cart")}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 rounded-lg font-bold transition shadow-md"
                      >
                        Go to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-2 rounded-lg font-bold transition shadow-md hover:shadow-lg"
                      >
                        Add to Cart
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => router.push("/login")}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-bold transition shadow-md"
                    >
                      Login to Order
                    </button>
                  )}

                </div>
              </div>
            );
          })}

        </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black text-white py-20 px-10">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose Bazara?</h2>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-800 transition shadow-lg hover:shadow-xl border border-gray-700">
            <div className="text-5xl mb-4">⚙️</div>
            <h3 className="font-bold text-xl mb-3">Industrial Grade</h3>
            <p className="text-gray-300">
              Built for industrial scale operations with enterprise-level security
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-800 transition shadow-lg hover:shadow-xl border border-gray-700">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-bold text-xl mb-3">Smart Analytics</h3>
            <p className="text-gray-300">
              Data-driven insights for smarter business decisions
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-800 transition shadow-lg hover:shadow-xl border border-gray-700">
            <div className="text-5xl mb-4">☁️</div>
            <h3 className="font-bold text-xl mb-3">Always Available</h3>
            <p className="text-gray-300">
              24×7 cloud infrastructure with 99.9% uptime guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Trusted Section */}
      <div className="bg-white text-black py-16 px-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Trusted by Industries Worldwide
          </h2>
          <p className="text-gray-600">
            Powering bulk B2B transactions with confidence
          </p>
        </div>
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
