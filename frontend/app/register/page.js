"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTokenCookie } from "../../utils/auth";

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "CLIENT",
    firstName: "",
    lastName: "",
    companyName: "",
    gstNumber: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful");

        // Auto login
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

        if (!loginRes.ok) {
          alert(loginData.message || "Login failed after signup");
          return;
        }

        setTokenCookie(loginData.token);

        router.push("/");
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-4">

      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:max-w-md md:p-8">

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Create Account
        </h2>

        <p className="mb-6 text-center text-xs text-gray-500 md:mb-8 md:text-sm">
          Join our B2B marketplace
        </p>

        {/* Email */}
        <input
          name="email"
          placeholder="Email"
          className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
          onChange={handleChange}
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
          onChange={handleChange}
        />

        {/* First + Last Name */}
        <div className="flex gap-2 md:gap-3">
          <input
            name="firstName"
            placeholder="First name"
            className="mb-3 w-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last name"
            className="mb-3 w-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <input
          name="phone"
          placeholder="Phone Number"
          className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
          onChange={handleChange}
        />

        {/* ROLE */}
        <select
          name="role"
          className="w-full mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
          onChange={handleChange}
        >
          <option value="CLIENT">Client</option>
          <option value="VENDOR">Vendor</option>
        </select>

        {/* ✅ SHOW ONLY IF VENDOR */}
        {form.role === "VENDOR" && (
          <>
            <input
              name="companyName"
              placeholder="Company Name"
              className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
              onChange={handleChange}
            />

            <input
              name="gstNumber"
              placeholder="GST Number"
              className="w-full mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-base"
              onChange={handleChange}
            />
          </>
        )}

        {/* Terms */}
        <div className="mb-4 flex items-start gap-2 text-xs text-gray-500 md:mb-6 md:text-sm">
          <input type="checkbox" className="mt-1 flex-shrink-0" />
          <p>I agree to Terms of Use and Privacy Policy</p>
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          className="w-full rounded-lg bg-blue-600 p-3 text-sm font-semibold text-white transition hover:bg-blue-700 md:text-base"
        >
          Create Account
        </button>

        {/* Login link */}
        <p className="mt-4 text-center text-xs text-gray-500 md:mt-6 md:text-sm">
          Already have an account? <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700">Login here</a>
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer text-blue-600 hover:underline"
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}
