"use client";

import { useEffect, useState } from "react";

export default function ClientDashboard() {
  const [products, setProducts] = useState([]);

  const token = typeof document !== "undefined"
  ? document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1]
  : null;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/products");
    const data = await res.json();
    setProducts(data);
  };

    const addToCart = async (productId) => {

    // ✅ Get token from cookie (CORRECT WAY)
    const token = document.cookie
        .split("; ")
        .find(row => row.startsWith("token="))
        ?.split("=")[1];

    console.log("TOKEN:", token);

    if (!token) {
        alert("Please login first");
        return;
    }

    try {
        const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/cart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            productId,
            quantity: 500 // 🔥 use higher value to pass MOQ
        })
        });

        const data = await res.json();

        if (res.ok) {
        alert("Added to cart");
        } else {
        alert(data.message); // 🔥 show real error
        }

    } catch (error) {
        console.error(error);
        alert("Server error");
    }
    };

  const placeOrder = async () => {
    const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/orders", {
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Client Portal</h1>

      {/* Products */}
      <div className="grid md:grid-cols-3 gap-8 mb-10">

        {products.map(product => (
          <div
            key={product.id}
            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition"
          >

            {/* ✅ IMAGE */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />

            <div className="p-4">

              {/* Name */}
              <h2 className="text-lg font-semibold mb-2">
                {product.name}
              </h2>

              {/* ✅ FINAL PRICE (IMPORTANT) */}
              <p className="text-green-400 font-bold text-lg">
                ₹{product.finalPrice}
              </p>

              {/* MOQ */}
              <p className="text-gray-400 mb-3">
                MOQ: {product.moq}
              </p>

              {/* Button */}
              <button
                onClick={() => addToCart(product.id)}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Add to Cart
              </button>

              <a href="/cart" className="bg-orange-600 px-4 py-2 rounded">
                Go to Cart
              </a>

            </div>
          </div>
        ))}

      </div>

      {/* Order Button */}
      <button
        onClick={placeOrder}
        className="bg-orange-600 px-6 py-3 rounded"
      >
        Place Order
      </button>

    </div>
  );
}
