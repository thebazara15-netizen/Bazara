"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {

  const [products, setProducts] = useState([]);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = async (productId) => {
    const token = document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];

    // ❌ Not logged in
    if (!token) {
      alert("Please login first");
      window.location.href = "/login";
      return;
    }

    // ✅ Logged in
    try {
      await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      });

      alert("Added to cart");
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    }
  };

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
          <Link href="/login">
            <button className="bg-orange-600 px-6 py-2 rounded-lg text-white">
              Login
            </button>
          </Link>

          {/* ✅ ONLY CHANGE: Register → Signup */}
          <Link href="/register">
            <button className="bg-green-600 px-6 py-2 rounded-lg text-white">
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

          {products.map(product => (
            <div
              key={product.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition"
            >

              <img
                src={product.image}
                className="h-40 w-full object-cover"
              />

              <div className="p-4">

                <h3 className="text-lg font-semibold">
                  {product.name}
                </h3>

                <p className="text-green-400 font-bold">
                  ₹{product.finalPrice}
                </p>

                <p className="text-gray-400 text-sm">
                  MOQ: {product.moq}
                </p>

                <button
                  onClick={() => addToCart(product.id)}
                  className="w-full mt-3 bg-orange-600 py-2 rounded hover:bg-orange-700"
                >
                  Add to Cart
                </button>

              </div>
            </div>
          ))}

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

    </div>
  );
}