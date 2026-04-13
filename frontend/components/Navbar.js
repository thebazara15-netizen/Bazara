"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const getToken = () => {
    if (typeof document === "undefined") return null;

    return document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
  };

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = getToken();

    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
    }
  }, []);

  // ✅ Logout
  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00";
    router.push("/login");
  };

  return (
    <div className="flex justify-between items-center px-8 py-4 bg-white text-black shadow">

      {/* Logo */}
      <Link href="/">
        <h1 className="font-bold text-xl cursor-pointer">Bazara</h1>
      </Link>

      {/* Right Side */}
      <div className="flex gap-4 items-center">

        {/* Always visible */}
        <Link href="/cart">
          <button className="bg-gray-200 px-4 py-2 rounded">
            Cart
          </button>
        </Link>

        {/* Not logged in */}
        {!user && (
          <>
            <Link href="/login">
              <button className="bg-orange-600 px-4 py-2 rounded text-white">
                Login
              </button>
            </Link>

            <Link href="/register">
              <button className="bg-green-600 px-4 py-2 rounded text-white">
                Signup
              </button>
            </Link>
          </>
        )}

        {/* Logged in */}
        {user && (
          <>
            <span className="font-semibold">
              {user.email}
            </span>

            <button
              onClick={logout}
              className="bg-red-600 px-4 py-2 rounded text-white"
            >
              Logout
            </button>
          </>
        )}

      </div>
    </div>
  );
}