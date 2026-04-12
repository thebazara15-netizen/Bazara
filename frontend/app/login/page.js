"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

        if (res.ok) {

        // Store token (use cookie now)
        document.cookie = `token=${data.token}; path=/`;

        alert("Login successful");

        // 🔥 ROLE-BASED REDIRECT
        if (data.user.role === "ADMIN") {
            router.push("/admin");
        } else if (data.user.role === "VENDOR") {
            router.push("/vendor");
        } else {
            router.push("/");
        }
        }
       else {
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
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 rounded bg-gray-700"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 rounded bg-gray-700"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-orange-600 hover:bg-orange-700 p-2 rounded"
        >
          Login
        </button>



      </div>
    </div>
  );
}