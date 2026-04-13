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

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-8 rounded-lg w-[420px] shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        {/* Email */}
        <input
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        {/* First + Last Name */}
        <div className="flex gap-3">
          <input
            name="firstName"
            placeholder="First name"
            className="w-1/2 mb-3 p-2 rounded bg-gray-700"
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last name"
            className="w-1/2 mb-3 p-2 rounded bg-gray-700"
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <input
          name="phone"
          placeholder="Phone Number"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        {/* ROLE */}
        <select
          name="role"
          className="w-full mb-4 p-2 rounded bg-gray-700"
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
              className="w-full mb-3 p-2 rounded bg-gray-700"
              onChange={handleChange}
            />

            <input
              name="gstNumber"
              placeholder="GST Number"
              className="w-full mb-3 p-2 rounded bg-gray-700"
              onChange={handleChange}
            />
          </>
        )}

        {/* Terms */}
        <div className="flex items-start gap-2 text-sm text-gray-400 mb-4">
          <input type="checkbox" />
          <p>I agree to Terms of Use and Privacy Policy</p>
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-orange-600 hover:bg-orange-700 p-2 rounded"
        >
          Create Account
        </button>

        {/* Login link */}
        <p className="text-center text-gray-400 mt-4">
          Already have an account?{" "}
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
