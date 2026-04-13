"use client";

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
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Client Portal</h1>

      {/* Products */}
      <div className="grid md:grid-cols-3 gap-8 mb-10">

        {products.length === 0 ? (
          <p>No products available</p>
        ) : (
          products.map(product => (
            <div
              key={product.id}
              className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition"
            >

              {/* Image */}
              <img
                src={product.image || "/industrial.jpg"}
                alt={product.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/industrial.jpg";
                }}
              />

              <div className="p-4">

                <h2 className="text-lg font-semibold mb-2">
                  {product.name}
                </h2>

                <p className="hidden">
                  ₹{product.finalPrice}
                </p>

                <p className="text-sm text-gray-300">
                  Client Price: {formatPrice(product.finalPrice)}
                </p>

                <p className="text-gray-400 mb-3">
                  MOQ: {product.moq}
                </p>

                <button
                  onClick={() => addToCart(product)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded mb-2"
                >
                  {loading ? "Adding..." : "Add to Cart"}
                </button>

                <a
                  href="/cart"
                  className="block text-center bg-orange-600 px-4 py-2 rounded"
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
        className="bg-orange-600 px-6 py-3 rounded"
      >
        Place Order
      </button>

    </div>
  );
}
