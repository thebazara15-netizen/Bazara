"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { decodeToken, getToken } from "../../utils/auth";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ClientDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const token = getToken();

  // ✅ Protect page
  useEffect(() => {
    const user = token ? decodeToken(token) : null;

    if (!token) {
      router.push("/login");
      return;
    }

    if (!user || user.role !== "CLIENT") {
      router.push("/");
      return;
    }

    fetchProducts();
  }, [router, token]);

  // ✅ Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Add to cart
  const addToCart = async (product) => {
    if (!token) {
      alert("Please login first");
      return;
    }

    if (loading) return;
    setLoading(true);

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

      if (res.ok) {
        alert("Added to cart");
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Place order
  const placeOrder = async () => {
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Order placed successfully");
      } else {
        alert("Order failed");
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">

      <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Client Portal</h1>

      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-10">

        {products.length === 0 ? (
          <p className="text-sm md:text-base">No products available</p>
        ) : (
          products.map(product => (
            <div
              key={product.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
            >
              {/* Clickable Product Info Section */}
              <Link href={`/product/${product.id}`} className="block cursor-pointer">
                {/* Image */}
                <img
                  src={product.images?.[0] || "/industrial.jpg"}
                  alt={product.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-cover hover:opacity-90 transition"
                  onError={(e) => {
                    e.currentTarget.src = "/industrial.jpg";
                  }}
                />

                <div className="p-3 md:p-4 pb-2 md:pb-3">
                  <h2 className="text-sm md:text-lg font-semibold mb-2 truncate hover:text-orange-400 transition">
                    {product.name}
                  </h2>

                  <p className="text-xs md:text-sm text-orange-400 font-semibold mb-1">
                    Client Price: {formatPrice(product.finalPrice)}
                  </p>

                  <p className="text-gray-400 text-xs md:text-sm">
                    MOQ: {product.moq}
                  </p>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 space-y-2">
                <button
                  onClick={() => addToCart(product)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded mb-2 text-xs md:text-sm font-medium transition"
                >
                  {loading ? "Adding..." : "🛒 Add to Cart"}
                </button>

                <a
                  href="/cart"
                  className="block text-center bg-orange-600 hover:bg-orange-700 px-3 md:px-4 py-2 rounded text-xs md:text-sm font-medium transition"
                >
                  Go to Cart
                </a>
              </div>
            </div>
          ))
        )}

      </div>

      {/* Order */}
      <button
        onClick={placeOrder}
        className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 md:px-6 py-2 md:py-3 rounded font-medium text-sm md:text-base transition shadow-lg"
      >
        Place Order
      </button>

    </div>
  );
}
