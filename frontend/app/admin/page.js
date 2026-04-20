"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function AdminDashboard() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [marginInputs, setMarginInputs] = useState({});
  const [savingProductId, setSavingProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null); // ✅ NEW: Track open dropdown menu

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

  // ✅ Protect Admin Page
  useEffect(() => {
    const token = getToken();

    if (!token) {
      localStorage.setItem("redirect", "/admin");
      router.push("/login");
      return;
    }

    const user = decodeToken(token);

    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    loadDashboard(token).catch((error) => {
      console.error(error);
      alert(error.message || "Failed to load admin dashboard");
    });
  }, [router]);

  // ✅ Fetch Users
  async function fetchUsers(token) {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Unable to fetch users");
    }

    setUsers(Array.isArray(data) ? data : []);
  }

  // ✅ Fetch Orders
  async function fetchOrders(token) {
    const res = await fetch(`${API}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Unable to fetch orders");
    }

    setOrders(Array.isArray(data) ? data : []);
  }

  async function fetchProducts(token) {
    const res = await fetch(`${API}/api/admin/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Unable to fetch products");
    }

    const nextProducts = Array.isArray(data) ? data : [];
    setProducts(nextProducts);
    setMarginInputs(
      nextProducts.reduce((acc, product) => {
        acc[product.id] = String(product.margin ?? 0);
        return acc;
      }, {})
    );
  }

  async function loadDashboard(token) {
    await Promise.all([
      fetchUsers(token),
      fetchOrders(token),
      fetchProducts(token)
    ]);
  }

  // ✅ Approve Vendor
  const approveVendor = async (id) => {
    const token = getToken();

    try {
      const res = await fetch(`${API}/api/admin/approve/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to approve vendor");
        return;
      }

      alert("Vendor approved");
      fetchUsers(token);
    } catch (error) {
      console.error(error);
      alert("Error approving vendor");
    }
  };

  const updateMarginInput = (productId, value) => {
    setMarginInputs((current) => ({
      ...current,
      [productId]: value
    }));
  };

  const saveMargin = async (productId) => {
    const token = getToken();
    const margin = Number(marginInputs[productId]);

    if (!Number.isFinite(margin) || margin < 0) {
      alert("Margin must be a valid percentage");
      return;
    }

    try {
      setSavingProductId(productId);

      const res = await fetch(`${API}/api/admin/product/${productId}/margin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ margin })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to update margin");
        return;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? data.product : product
        )
      );

      setMarginInputs((current) => ({
        ...current,
        [productId]: String(data.product.margin ?? margin)
      }));

      alert("Margin updated successfully");
    } catch (error) {
      console.error(error);
      alert("Error updating margin");
    } finally {
      setSavingProductId(null);
    }
  };

  // ✅ NEW: Delete product (admin only)
  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const token = getToken();

    try {
      const res = await fetch(`${API}/api/admin/product/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error deleting product");
        return;
      }

      alert("Product deleted successfully");
      fetchProducts(token);
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  };

  // ✅ NEW: Open edit form for a product
  const openEditForm = (product) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      moq: product.moq || '',
      stock: product.stock || '',
      basePrice: product.basePrice || '',
      margin: product.margin || 0
    });
  };

  // ✅ NEW: Update product (admin only)
  const saveProductEdit = async (productId) => {
    const token = getToken();

    if (!editForm.name || !editForm.basePrice) {
      alert("Name and Base Price are required");
      return;
    }

    try {
      setSavingProductId(productId);

      const res = await fetch(`${API}/api/admin/product/${productId}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error updating product");
        return;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? data.product : product
        )
      );

      setEditingProductId(null);
      setEditForm({});
      alert("Product updated successfully");
    } catch (error) {
      console.error(error);
      alert("Error updating product");
    } finally {
      setSavingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="flex flex-col md:flex-row">
        <Sidebar />

        <div className="flex-1 p-4 md:p-8">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1 md:mt-2 text-sm md:text-base">Manage your marketplace with precision</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 md:mb-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-xl md:text-3xl mb-1 md:mb-3">👥</div>
                <h2 className="text-gray-300 text-xs md:text-sm font-medium">Total Users</h2>
                <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{users.length}</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-xl md:text-3xl mb-1 md:mb-3">📦</div>
                <h2 className="text-gray-300 text-xs md:text-sm font-medium">Total Orders</h2>
                <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{orders.length}</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-xl md:text-3xl mb-1 md:mb-3">🏪</div>
                <h2 className="text-gray-300 text-xs md:text-sm font-medium">Vendors</h2>
                <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">
                  {users.filter((user) => user.role === "VENDOR").length}
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-xl md:text-3xl mb-1 md:mb-3">📊</div>
                <h2 className="text-gray-300 text-xs md:text-sm font-medium">Products</h2>
                <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{products.length}</p>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="mb-8 md:mb-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-4 md:p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="text-2xl md:text-3xl">👥</div>
              <h2 className="text-lg md:text-2xl font-bold">Users Management</h2>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-400 text-center py-6 md:py-8 text-sm md:text-base">No users found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-900/50 p-3 md:p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm md:text-base truncate">{user.email}</p>
                      <p className="text-xs md:text-sm text-gray-400">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN" ? "bg-red-500/20 text-red-300" :
                          user.role === "VENDOR" ? "bg-purple-500/20 text-purple-300" :
                          "bg-blue-500/20 text-blue-300"
                        }`}>
                          {user.role}
                        </span>
                        {user.role === "VENDOR" && (
                          <span className={`ml-2 text-xs ${user.isVerified ? "text-green-400" : "text-yellow-400"}`}>
                            {user.isVerified ? "✓ Verified" : "⚠ Pending"}
                          </span>
                        )}
                      </p>
                    </div>

                    {user.role === "VENDOR" && !user.isVerified && (
                      <button
                        onClick={() => approveVendor(user.id)}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/30 text-xs md:text-sm"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Management Section */}
          <div className="mb-8 md:mb-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-4 md:p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="text-2xl md:text-3xl">⚙️</div>
              <h2 className="text-lg md:text-2xl font-bold">Product Management</h2>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-400 text-center py-6 md:py-8 text-sm md:text-base">No products found</p>
            ) : (
              <div className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-900/50 p-3 md:p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200">
                    {editingProductId === product.id ? (
                      // ✅ EDIT MODE
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Product Name"
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description"
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm h-16"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            placeholder="Category"
                            className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm"
                          />
                          <input
                            type="number"
                            value={editForm.moq}
                            onChange={(e) => setEditForm({ ...editForm, moq: e.target.value })}
                            placeholder="MOQ"
                            className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                            placeholder="Stock"
                            className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm"
                          />
                          <input
                            type="number"
                            value={editForm.basePrice}
                            onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                            placeholder="Base Price"
                            className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveProductEdit(product.id)}
                            disabled={savingProductId === product.id}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-2 rounded-lg font-medium text-xs md:text-sm transition"
                          >
                            {savingProductId === product.id ? "Saving..." : "✅ Save"}
                          </button>
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium text-xs md:text-sm transition"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ✅ VIEW MODE
                      <>
                        <div className="relative">
                          {/* 3-Dot Menu Button - Top Right Corner */}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                            className="absolute top-0 right-0 bg-gray-700 hover:bg-gray-600 text-white p-1.5 md:p-2 rounded-lg transition text-lg"
                          >
                            ⋯
                          </button>

                          <div className="flex flex-col gap-3 pr-8">
                            <div className="flex-1">
                              <h3 className="font-bold text-base md:text-lg text-white truncate">{product.name}</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 md:mt-2 text-xs md:text-sm">
                                <p className="text-gray-400">
                                  Vendor Price: <span className="text-orange-400 font-medium">{formatPrice(product.basePrice)}</span>
                                </p>
                                <p className="text-gray-400">
                                  Client Price: <span className="text-green-400 font-medium">{formatPrice(product.finalPrice)}</span>
                                </p>
                                <p className="text-gray-400">
                                  Margin: <span className="text-blue-400 font-medium">{product.margin}%</span>
                                </p>
                                <p className="text-gray-400">
                                  MOQ: <span className="text-purple-400 font-medium">{product.moq}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Dropdown Menu */}
                          {openMenuId === product.id && (
                            <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-40">
                              <button
                                onClick={() => {
                                  openEditForm(product);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-2 border-b border-gray-700 transition"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  deleteProduct(product.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-medium text-sm flex items-center gap-2 transition"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-4 md:p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="text-2xl md:text-3xl">📋</div>
              <h2 className="text-lg md:text-2xl font-bold">Recent Orders</h2>
            </div>

            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-6 md:py-8 text-sm md:text-base">No orders found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map(order => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-900/50 p-3 md:p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 gap-2 sm:gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm md:text-base">Order #{order.id}</p>
                      <p className="text-xs md:text-sm text-gray-400">Total: <span className="text-green-400 font-semibold">₹{order.totalAmount}</span></p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      order.status === "completed" ? "bg-green-500/20 text-green-300" :
                      order.status === "pending" ? "bg-yellow-500/20 text-yellow-300" :
                      "bg-blue-500/20 text-blue-300"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
