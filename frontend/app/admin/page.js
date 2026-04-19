"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { clearTokenCookie as authClearTokenCookie } from "../../utils/auth";

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

  // ✅ Logout
  const logout = () => {
    authClearTokenCookie();
    window.location.href = "/login";
  };

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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <div className="flex gap-3">
              <Link href="/">
                <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700">
                  ← Back to Home
                </button>
              </Link>
              <button
                onClick={logout}
                className="rounded bg-red-600 px-4 py-2 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mb-10 grid gap-6 md:grid-cols-4">
            <div className="rounded bg-gray-800 p-4">
              <h2>Total Users</h2>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>

            <div className="rounded bg-gray-800 p-4">
              <h2>Total Orders</h2>
              <p className="text-2xl font-semibold">{orders.length}</p>
            </div>

            <div className="rounded bg-gray-800 p-4">
              <h2>Vendors</h2>
              <p className="text-2xl font-semibold">
                {users.filter((user) => user.role === "VENDOR").length}
              </p>
            </div>

            <div className="rounded bg-gray-800 p-4">
              <h2>Products</h2>
              <p className="text-2xl font-semibold">{products.length}</p>
            </div>
          </div>

          <div className="mb-10 rounded bg-gray-800 p-6">
            <h2 className="mb-4 text-xl">Users</h2>

            {users.length === 0 ? (
              <p>No users found</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b py-3"
                >
                  <div>
                    {user.email} ({user.role})
                    {user.role === "VENDOR" && (
                      <span className="ml-2 text-sm text-gray-400">
                        {user.isVerified ? "Verified" : "Pending approval"}
                      </span>
                    )}
                  </div>

                  {user.role === "VENDOR" && !user.isVerified && (
                    <button
                      onClick={() => approveVendor(user.id)}
                      className="rounded bg-green-600 px-4 py-1"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mb-10 rounded bg-gray-800 p-6">
            <h2 className="mb-4 text-xl">Product Margin Control</h2>

            {products.length === 0 ? (
              <p>No products found</p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="border-b py-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-400">
                        Vendor Price: {formatPrice(product.basePrice)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Client Price: {formatPrice(product.finalPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={marginInputs[product.id] ?? ""}
                        onChange={(e) => updateMarginInput(product.id, e.target.value)}
                        className="w-28 rounded bg-gray-700 p-2"
                      />

                      <span className="text-sm text-gray-300">%</span>

                      <button
                        onClick={() => saveMargin(product.id)}
                        disabled={savingProductId === product.id}
                        className="rounded bg-orange-600 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingProductId === product.id ? "Saving..." : "Save Margin"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded bg-gray-800 p-6">
            <h2 className="mb-4 text-xl">Orders</h2>

        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="border-b py-2">
              Order #{order.id} — ₹{order.totalAmount} — {order.status}
            </div>
          ))
        )}
      </div>

        </div>
      </div>
    </div>
  );
}
