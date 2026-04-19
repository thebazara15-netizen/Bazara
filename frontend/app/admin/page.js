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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage your marketplace with precision</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-12 grid gap-6 md:grid-cols-4">
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-3xl mb-3">👥</div>
                <h2 className="text-gray-300 text-sm font-medium">Total Users</h2>
                <p className="text-4xl font-bold mt-2">{users.length}</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-3xl mb-3">📦</div>
                <h2 className="text-gray-300 text-sm font-medium">Total Orders</h2>
                <p className="text-4xl font-bold mt-2">{orders.length}</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-3xl mb-3">🏪</div>
                <h2 className="text-gray-300 text-sm font-medium">Vendors</h2>
                <p className="text-4xl font-bold mt-2">
                  {users.filter((user) => user.role === "VENDOR").length}
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-3xl mb-3">📊</div>
                <h2 className="text-gray-300 text-sm font-medium">Products</h2>
                <p className="text-4xl font-bold mt-2">{products.length}</p>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="mb-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">👥</div>
              <h2 className="text-2xl font-bold">Users Management</h2>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No users found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{user.email}</p>
                      <p className="text-sm text-gray-400">
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
                        className="ml-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/30"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Margin Control */}
          <div className="mb-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">💰</div>
              <h2 className="text-2xl font-bold">Product Margin Control</h2>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No products found</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-bold text-lg text-white">{product.name}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <p className="text-gray-400">
                            Vendor: <span className="text-orange-400 font-medium">{formatPrice(product.basePrice)}</span>
                          </p>
                          <p className="text-gray-400">
                            Client: <span className="text-green-400 font-medium">{formatPrice(product.finalPrice)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={marginInputs[product.id] ?? ""}
                            onChange={(e) => updateMarginInput(product.id, e.target.value)}
                            className="w-24 bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>

                        <button
                          onClick={() => saveMargin(product.id)}
                          disabled={savingProductId === product.id}
                          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-orange-500/30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {savingProductId === product.id ? (
                            <>
                              <span className="animate-spin">⟳</span>
                              Saving...
                            </>
                          ) : (
                            "Save Margin"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 p-8 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📋</div>
              <h2 className="text-2xl font-bold">Recent Orders</h2>
            </div>

            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No orders found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200">
                    <div className="flex-1">
                      <p className="font-medium text-white">Order #{order.id}</p>
                      <p className="text-sm text-gray-400">Total: <span className="text-green-400 font-semibold">₹{order.totalAmount}</span></p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
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
