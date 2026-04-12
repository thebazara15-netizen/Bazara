"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async () => {
    // ✅ Validation
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Secure cookie (1 day)
        document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=strict`;

        alert("Login successful");

        // ✅ Role-based redirect
        if (data.user.role === "ADMIN") {
          router.push("/admin");
        } else if (data.user.role === "VENDOR") {
          router.push("/vendor");
        } else {
          router.push("/");
        }

      } else {
        alert(data.message || "Invalid credentials");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-8 rounded-lg w-96 shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 rounded bg-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 rounded bg-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 p-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}