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

  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registered successfully");

        // Auto login after register
        const loginRes = await fetch("process.env.NEXT_PUBLIC_API_URL/api/auth/login", {
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

        localStorage.setItem("token", loginData.token);

        // Redirect based on role
        if (loginData.user.role === "ADMIN") {
          router.push("/admin");
        } else if (loginData.user.role === "VENDOR") {
          router.push("/vendor");
        } else {
          router.push("/");
        }

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
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
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        <select
          name="role"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        >
          <option value="CLIENT">Client</option>
          <option value="VENDOR">Vendor</option>
          <option value="ADMIN">Admin</option>
        </select>

        <input
          name="companyName"
          placeholder="Company Name"
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        <input
          name="gstNumber"
          placeholder="GST Number"
          className="w-full mb-6 p-2 rounded bg-gray-700"
          onChange={handleChange}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-orange-600 hover:bg-orange-700 p-2 rounded"
        >
          Register
        </button>

      </div>
    </div>
  );
}