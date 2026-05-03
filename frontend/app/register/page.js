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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 md:p-8 rounded-lg w-full max-w-sm md:max-w-md shadow-2xl">

        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Create Account
        </h2>

        <p className="text-gray-400 text-center mb-6 md:mb-8 text-xs md:text-sm">
          Join our B2B marketplace
        </p>

        {/* Email */}
        <input
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
          onChange={handleChange}
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
          onChange={handleChange}
        />

        {/* First + Last Name */}
        <div className="flex gap-2 md:gap-3">
          <input
            name="firstName"
            placeholder="First name"
            className="w-1/2 mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-xs md:text-base"
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last name"
            className="w-1/2 mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-xs md:text-base"
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <input
          name="phone"
          placeholder="Phone Number"
          className="w-full mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
          onChange={handleChange}
        />

        {/* ROLE */}
        <select
          name="role"
          className="w-full mb-4 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white text-sm md:text-base"
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
              className="w-full mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
              onChange={handleChange}
            />

            <input
              name="gstNumber"
              placeholder="GST Number"
              className="w-full mb-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-orange-500 focus:outline-none transition text-white placeholder-gray-500 text-sm md:text-base"
              onChange={handleChange}
            />
          </>
        )}

        {/* Terms */}
        <div className="flex items-start gap-2 text-xs md:text-sm text-gray-400 mb-4 md:mb-6">
          <input type="checkbox" className="mt-1 flex-shrink-0" />
          <p>I agree to Terms of Use and Privacy Policy</p>
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 p-3 rounded-lg font-bold transition shadow-lg text-sm md:text-base"
        >
          Create Account
        </button>

        {/* Login link */}
        <p className="text-center text-gray-400 mt-4 md:mt-6 text-xs md:text-sm">
          Already have an account? <a href="/login" className="text-orange-400 hover:text-orange-300 font-semibold">Login here</a>
          <span
            onClick={() => router.push("/login")}
            className="text-orange-500 cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}
