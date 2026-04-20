"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTokenCookie } from "../../utils/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async () => {
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
      setTokenCookie(data.token);

      // ✅ CHECK IF USER WAS REDIRECTED FROM SOME PAGE
      const redirect = localStorage.getItem("redirect");
      const defaultRoute =
        data.user.role === "ADMIN"
          ? "/admin"
          : data.user.role === "VENDOR"
            ? "/vendor"
            : "/";

      const allowedRedirects =
        data.user.role === "ADMIN"
          ? ["/admin"]
          : data.user.role === "VENDOR"
            ? ["/vendor", "/cart"]
            : ["/cart", "/"];

      localStorage.removeItem("redirect");

      // ✅ YOUR EXISTING ROLE LOGIC (UNCHANGED)
      if (redirect && allowedRedirects.includes(redirect)) {
        router.push(redirect);
      } else {
        router.push(defaultRoute);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 md:p-8 rounded-lg w-full max-w-sm md:max-w-md shadow-2xl">

        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Welcome Back
        </h2>

        <p className="text-gray-400 text-center mb-6 md:mb-8 text-sm md:text-base">
          Sign in to your account
        </p>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 md:mb-4 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 md:mb-6 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 p-3 rounded-lg font-bold transition shadow-lg text-sm md:text-base"
        >
          {loading ? "⏳ Logging in..." : "Login"}
        </button>

        <p className="mt-4 md:mt-6 text-center text-gray-400 text-xs md:text-sm">
          Don't have an account? <a href="/register" className="text-orange-400 hover:text-orange-300 font-semibold">Register here</a>
        </p>

      </div>
    </div>
  );
}
