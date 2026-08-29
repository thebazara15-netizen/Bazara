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
  const API = "/api";

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
        const res = await fetch(`${API}/auth/social-config`);
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

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim(), password })
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
    }

    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-4">
      <div className="w-full max-w-sm md:max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Welcome Back
        </h2>

        <p className="mb-6 text-center text-sm text-gray-500 md:mb-8 md:text-base">
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-4 relative">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:mb-4 md:text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:mb-6 md:text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="relative z-10 w-full cursor-pointer rounded-lg bg-blue-600 p-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 md:text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">{error}</p>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-gray-500 md:mt-6 md:text-sm">
          Don&apos;t have an account? <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700">Register here</a>
        </p>

        {Object.values(socialProviders).some(Boolean) && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <p className="text-center text-sm text-gray-500">Or continue with</p>
            <div className="mt-4 flex items-center justify-center gap-5">
              {socialProviders.facebook && (
                <a
                  href={`${API}/auth/facebook`}
                  aria-label="Continue with Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877f2] text-2xl font-bold text-white transition hover:scale-105"
                >
                  f
                </a>
              )}
              {socialProviders.google && (
                <a
                  href={`${API}/auth/google`}
                  aria-label="Continue with Google"
                  className="text-4xl font-bold leading-none text-[#4285f4] transition hover:scale-105"
                >
                  G
                </a>
              )}
              {socialProviders.linkedin && (
                <a
                  href={`${API}/auth/linkedin`}
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
