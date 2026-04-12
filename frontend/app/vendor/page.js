"use client";

import { useEffect, useState } from "react";

export default function VendorDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    moq: "",
    stock: "",
    basePrice: ""
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addProduct = async () => {
    const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/products", {
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
      alert("Product added");
      fetchProducts();
    } else {
      alert("Error adding product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>

      {/* Add Product Form */}
      <div className="bg-gray-800 p-6 rounded mb-10">
        <h2 className="text-xl mb-4">Add Product</h2>

        <input name="name" placeholder="Name" onChange={handleChange} className="w-full mb-2 p-2 bg-gray-700 rounded" />
        <input name="description" placeholder="Description" onChange={handleChange} className="w-full mb-2 p-2 bg-gray-700 rounded" />
        <input name="category" placeholder="Category" onChange={handleChange} className="w-full mb-2 p-2 bg-gray-700 rounded" />
        <input name="moq" placeholder="MOQ" onChange={handleChange} className="w-full mb-2 p-2 bg-gray-700 rounded" />
        <input name="stock" placeholder="Stock" onChange={handleChange} className="w-full mb-2 p-2 bg-gray-700 rounded" />
        <input name="basePrice" placeholder="Base Price" onChange={handleChange} className="w-full mb-4 p-2 bg-gray-700 rounded" />

        <button
          onClick={addProduct}
          className="bg-orange-600 px-4 py-2 rounded"
        >
          Add Product
        </button>
      </div>

      {/* Product List */}
      <div className="bg-gray-800 p-6 rounded">
        <h2 className="text-xl mb-4">My Products</h2>

        {products.map(product => (
          <div key={product.id} className="border-b py-2">
            {product.name} — ₹{product.basePrice}
          </div>
        ))}
      </div>

    </div>
  );
}