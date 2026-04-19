"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorDashboard() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    moq: "",
    stock: "",
    basePrice: ""
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Get token
  const getToken = () => {
    if (typeof document === "undefined") return null;

    return document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
  };

  // ✅ Decode token
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  // ✅ Protect page (VERY IMPORTANT)
  useEffect(() => {
    const token = getToken();

    if (!token) {
      localStorage.setItem("redirect", "/cart");
      router.push("/login");
      return;
    }

    const user = decodeToken(token);

    if (!user || user.role !== "VENDOR") {
      router.push("/");
      return;
    }

    fetchProducts(token);
  }, []);

  // ✅ Fetch Products
  const fetchProducts = async (token) => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      // ✅ FIXED: Ensure products is always an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProducts([]); // ✅ Fallback to empty array on error
    }
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ UPDATED: Handle multiple image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);

    // ✅ Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // ✅ Add Product with multiple images
  const addProduct = async () => {
    const token = getToken();

    if (!form.name || !form.basePrice) {
      alert("Name and price are required");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // ✅ Use FormData to handle multiple files
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("moq", Number(form.moq));
      formData.append("stock", Number(form.stock));
      formData.append("basePrice", Number(form.basePrice));
      formData.append("pricingTiers", JSON.stringify([]));

      // ✅ Append all selected images
      selectedImages.forEach(image => {
        formData.append("images", image);
      });

      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert("Product added successfully with images!");

        setForm({
          name: "",
          description: "",
          category: "",
          moq: "",
          stock: "",
          basePrice: ""
        });
        setSelectedImages([]);
        setImagePreviews([]);

        // ✅ Reset file input
        const fileInput = document.getElementById("imageInput");
        if (fileInput) fileInput.value = "";

        fetchProducts(token);
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

  // ✅ Navigate to next/previous image in gallery
  const nextImage = (productId) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % (products.find(p => p.id === productId)?.images?.length || 1)
    }));
  };

  const prevImage = (productId) => {
    const product = products.find(p => p.id === productId);
    const imageCount = product?.images?.length || 1;
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + imageCount) % imageCount
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>

      {/* Add Product Form */}
      <div className="bg-gray-800 p-6 rounded mb-10">
        <h2 className="text-xl mb-4">Add Product</h2>

        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded"
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={form.description}
          onChange={handleChange}
          className="w-full mb-2 p-2 bg-gray-700 rounded h-20"
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
          placeholder="MOQ (Minimum Order Quantity)"
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
          placeholder="Base Price (Rs.)"
          value={form.basePrice}
          onChange={handleChange}
          className="w-full mb-4 p-2 bg-gray-700 rounded"
        />

        {/* ✅ NEW: Multiple Image Upload */}
        <div className="mb-4">
          <label className="block text-sm mb-2">Upload Product Images (up to 10)</label>
          <input
            id="imageInput"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full p-2 bg-gray-700 rounded text-white cursor-pointer"
          />
          <p className="text-sm text-gray-400 mt-1">
            Selected: {selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""}
          </p>

          {/* ✅ Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <span className="absolute top-1 right-1 bg-orange-600 text-white px-2 py-1 rounded text-xs">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={addProduct}
          disabled={loading}
          className="bg-orange-600 px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </div>

      {/* Product List with Image Gallery */}
      <div className="bg-gray-800 p-6 rounded">
        <h2 className="text-xl mb-6">My Products</h2>

        {products.length === 0 ? (
          <p>No products available</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-gray-700 p-4 rounded-lg overflow-hidden">
                {/* ✅ Image Gallery */}
                {product.images && product.images.length > 0 ? (
                  <div className="relative mb-4">
                    <img
                      src={product.images[currentImageIndex[product.id] || 0]}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded"
                    />

                    {/* ✅ Image Navigation */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={() => prevImage(product.id)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white px-2 py-1 rounded"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => nextImage(product.id)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white px-2 py-1 rounded"
                        >
                          ▶
                        </button>
                      </>
                    )}

                    {/* ✅ Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {(currentImageIndex[product.id] || 0) + 1} / {product.images.length}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-600 rounded mb-4 flex items-center justify-center">
                    <span className="text-gray-400">No images</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="text-sm">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-300 mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-yellow-400 mb-1">₹{product.basePrice}</p>
                  <p className="text-gray-400 text-xs">MOQ: {product.moq}</p>
                  <p className="text-gray-400 text-xs">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}