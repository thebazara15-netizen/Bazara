"use client";

import { useEffect, useState } from "react";

export default function VendorDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    moq: "",
    stock: "",
    basePrice: ""
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  const token =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find(row => row.startsWith("token="))
          ?.split("=")[1]
      : null;

  // ✅ Protect page
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    } else {
      fetchProducts();
    }
  }, []);

  // ✅ Fetch Products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Add Product
  const addProduct = async () => {
    if (!form.name || !form.basePrice) {
      alert("Name and price are required");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          moq: Number(form.moq),
          stock: Number(form.stock),
          basePrice: Number(form.basePrice),
          pricingTiers: []
        })
      });

      if (res.ok) {
        alert("Product added successfully");

        // Reset form
        setForm({
          name: "",
          description: "",
          category: "",
          moq: "",
          stock: "",
          basePrice: ""
        });

        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Error adding product");
      }

    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>

      {/* Add Product Form */}
      <div className="bg-gray-800 p-6 rounded mb-10">
        <h2 className="text-xl mb-4">Add Product</h2>

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <input
          name="moq"
          placeholder="MOQ"
          value={form.moq}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <input
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <input
          name="basePrice"
          placeholder="Base Price"
          value={form.basePrice}
          onChange={handleChange}
          className="w-full mb-4 p-2 bg-gray-700 rounded"
        />

        <button
          onClick={addProduct}
          disabled={loading}
          className="bg-orange-600 px-4 py-2 rounded"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </div>

      {/* Product List */}
      <div className="bg-gray-800 p-6 rounded">
        <h2 className="text-xl mb-4">My Products</h2>

        {products.length === 0 ? (
          <p>No products available</p>
        ) : (
          products.map(product => (
            <div key={product.id} className="border-b py-2">
              {product.name} — ₹{product.basePrice}
            </div>
          ))
        )}
      </div>

    </div>
  );
}