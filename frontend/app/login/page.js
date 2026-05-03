"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setTokenCookie } from "../../utils/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialProviders, setSocialProviders] = useState({});

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  console.debug("Login API:", API);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const socialError = searchParams.get("socialError");

    if (socialError && !socialError.toLowerCase().includes("not configured")) {
      setError(socialError);
    }

    if (socialError) {
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    const loadSocialProviders = async () => {
      try {
        const res = await fetch(`${API}/api/auth/social-config`);
        const data = await res.json();
        setSocialProviders(data || {});
      } catch {
        setSocialProviders({});
      }
    };

    loadSocialProviders();
  }, [API]);

  const handleLogin = async (event) => {
    event?.preventDefault();

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
            : ["/cart", "/checkout", "/"];

      localStorage.removeItem("redirect");

      // ✅ YOUR EXISTING ROLE LOGIC (UNCHANGED)
      if (redirect && allowedRedirects.includes(redirect)) {
        router.push(redirect);
      } else {
        router.push(defaultRoute);
      }

    } else {
      const message = data.message || "Invalid credentials";
      setError(message);
      alert(message);
    }

    } catch (error) {
      console.error("Login error:", error);
      setError("Server error");
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

        <form onSubmit={handleLogin} className="space-y-4 relative">
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
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="relative z-10 w-full cursor-pointer bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 p-3 rounded-lg font-bold transition shadow-lg text-sm md:text-base"
          >
            {loading ? "⏳ Logging in..." : "Login"}
          </button>
          {error && (
            <p className="mt-3 text-center text-red-400 text-sm">{error}</p>
          )}
        </form>

        <p className="mt-4 md:mt-6 text-center text-gray-400 text-xs md:text-sm">
          Don&apos;t have an account? <a href="/register" className="text-orange-400 hover:text-orange-300 font-semibold">Register here</a>
        </p>

        {Object.values(socialProviders).some(Boolean) && (
          <div className="mt-6 border-t border-gray-700 pt-5">
            <p className="text-center text-sm text-gray-400">Or continue with</p>
            <div className="mt-4 flex items-center justify-center gap-5">
              {socialProviders.facebook && (
                <a
                  href={`${API}/api/auth/facebook`}
                  aria-label="Continue with Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877f2] text-2xl font-bold text-white transition hover:scale-105"
                >
                  f
                </a>
              )}
              {socialProviders.google && (
                <a
                  href={`${API}/api/auth/google`}
                  aria-label="Continue with Google"
                  className="text-4xl font-bold leading-none text-[#4285f4] transition hover:scale-105"
                >
                  G
                </a>
              )}
              {socialProviders.linkedin && (
                <a
                  href={`${API}/api/auth/linkedin`}
                  aria-label="Continue with LinkedIn"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2867b2] text-lg font-bold text-white transition hover:scale-105"
                >
                  in
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
