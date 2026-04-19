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

  // ✅ Fetch Products (only vendor's own)
  const fetchProducts = async (token) => {
    try {
      const res = await fetch(`${API}/api/products/vendor/my-products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-3">
          Vendor Dashboard
        </h1>
        <p className="text-gray-400 text-lg">Manage and showcase your premium products</p>
      </div>

      {/* Add Product Form - Premium Card */}
      <div className="mb-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50 shadow-2xl hover:border-orange-500/30 transition">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">📦</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Add New Product
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
          />

          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
          />

          <input
            name="moq"
            placeholder="MOQ (Minimum Order Quantity)"
            value={form.moq}
            onChange={handleChange}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
          />

          <input
            name="stock"
            placeholder="Stock Quantity"
            value={form.stock}
            onChange={handleChange}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
          />

          <input
            name="basePrice"
            placeholder="Base Price (Rs.)"
            value={form.basePrice}
            onChange={handleChange}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
          />
        </div>

        <textarea
          name="description"
          placeholder="Product Description"
          value={form.description}
          onChange={handleChange}
          className="w-full mt-4 bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition h-24"
        />

        {/* Image Upload Section */}
        <div className="mt-6 p-6 bg-gray-900/50 border border-gray-600 rounded-lg">
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            Upload Product Images (up to 10)
          </label>
          <input
            id="imageInput"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full p-3 bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg text-white cursor-pointer hover:border-orange-500 transition"
          />
          <p className="text-sm text-gray-400 mt-2">
            {selectedImages.length === 0 ? 'No images selected' : `Selected: ${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''}`}
          </p>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-orange-500/50 group-hover:border-orange-500 transition"
                  />
                  <span className="absolute top-1 right-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-2 py-1 rounded text-xs font-bold">
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
          className="w-full mt-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 shadow-lg"
        >
          {loading ? "⏳ Adding Product..." : "✨ Add Product"}
        </button>
      </div>

      {/* My Products Section */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="text-3xl">🏪</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            My Products ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-gray-400 text-lg">No products yet. Add your first product above!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div 
                key={product.id} 
                className="group bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/50 hover:border-orange-500/50 rounded-xl overflow-hidden transition transform hover:scale-105 shadow-lg"
              >
                {/* Image Gallery */}
                {product.images && product.images.length > 0 ? (
                  <div className="relative h-48 bg-gray-900 overflow-hidden">
                    <img
                      src={product.images[currentImageIndex[product.id] || 0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Image Navigation */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={() => prevImage(product.id)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => nextImage(product.id)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          ▶
                        </button>
                      </>
                    )}

                    {/* Image Counter & Dots */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {product.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(prev => ({ ...prev, [product.id]: idx }))}
                          className={`w-2 h-2 rounded-full transition ${
                            idx === (currentImageIndex[product.id] || 0) ? 'bg-orange-500' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">📷 No Image</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-white line-clamp-2 group-hover:text-orange-400 transition">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  {/* Price */}
                  <div className="mb-3 p-3 bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-gray-400">Base Price</p>
                    <p className="text-xl font-bold text-orange-400">₹{product.basePrice}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-700/50 p-2 rounded-lg">
                      <p className="text-gray-500">MOQ</p>
                      <p className="text-white font-semibold">{product.moq} units</p>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded-lg">
                      <p className="text-gray-500">Stock</p>
                      <p className="text-white font-semibold">{product.stock} units</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}