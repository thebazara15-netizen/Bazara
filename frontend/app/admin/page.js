"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  const API = `${process.env.NEXT_PUBLIC_API_URL}/api/...`;

  const token =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find(row => row.startsWith("token="))
          ?.split("=")[1]
      : null;

  useEffect(() => {
    fetchUsers();
    fetchOrders();
  }, []);

  // ✅ FIXED
  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00";
    window.location.href = "/login";
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setUsers(data);
  };

  const fetchOrders = async () => {
    const res = await fetch(`${API}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setOrders(data);
  };

  const approveVendor = async (id) => {
    await fetch(`${API}/api/admin/approve/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert("Vendor Approved");
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-4 rounded">
          <h2>Total Users</h2>
          <p className="text-xl">{users.length}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2>Total Orders</h2>
          <p className="text-xl">{orders.length}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2>Vendors</h2>
          <p className="text-xl">
            {users.filter(u => u.role === "VENDOR").length}
          </p>
        </div>
      </div>

      {/* Users */}
      <div className="bg-gray-800 p-6 rounded mb-10">
        <h2 className="text-xl mb-4">Users</h2>

        {users.map(user => (
          <div key={user.id} className="flex justify-between border-b py-2">
            <div>
              {user.email} ({user.role})
            </div>

            {user.role === "VENDOR" && !user.isVerified && (
              <button
                onClick={() => approveVendor(user.id)}
                className="bg-green-600 px-4 py-1 rounded"
              >
                Approve
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Orders */}
      <div className="bg-gray-800 p-6 rounded">
        <h2 className="text-xl mb-4">Orders</h2>

        {orders.map(order => (
          <div key={order.id} className="border-b py-2">
            Order #{order.id} — ₹{order.totalAmount} — {order.status}
          </div>
        ))}
      </div>

      {/* ✅ Logout Button */}
      <button onClick={logout} className="bg-red-600 px-4 py-2 rounded mt-6">
        Logout
      </button>

      {/* Layout */}
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6"></div>
      </div>

    </div>
  );
}