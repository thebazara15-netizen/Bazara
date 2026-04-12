"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "CLIENT",
    companyName: "",
    gstNumber: ""
  });

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    // ✅ Validation
    if (!form.email || !form.password) {
      alert("Email and password are required");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // ✅ REGISTER
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registered successfully");

        // ✅ AUTO LOGIN
        const loginRes = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password
          })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok) {
          // ✅ STORE TOKEN IN COOKIE (same as login page)
          document.cookie = `token=${loginData.token}; path=/; max-age=86400; samesite=strict`;

          // ✅ ROLE BASED REDIRECT
          if (loginData.user.role === "ADMIN") {
            router.push("/admin");
          } else if (loginData.user.role === "VENDOR") {
            router.push("/vendor");
          } else {
            router.push("/");
          }
        } else {
          alert("Login failed after registration");
        }

      } else {
        alert(data.message || "Registration failed");
      }

    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-8 rounded-lg w-96 shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Register
        </h2>

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-gray-700"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-gray-700"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-gray-700"
        >
          <option value="CLIENT">Client</option>
          <option value="VENDOR">Vendor</option>
          <option value="ADMIN">Admin</option>
        </select>

        <input
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-gray-700"
        />

        <input
          name="gstNumber"
          placeholder="GST Number"
          value={form.gstNumber}
          onChange={handleChange}
          className="w-full mb-6 p-2 rounded bg-gray-700"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 p-2 rounded"
        >
          {loading ? "Registering..." : "Register"}
        </button>

      </div>
    </div>
  );
}