"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearTokenCookie, decodeToken, getToken } from "../utils/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const fetchUserDetails = async (userId, token) => {
    try {
      // For now, decode details from token if available
      const decoded = decodeToken(token);
      setUserDetails({
        id: decoded.id,
        role: decoded.role,
        // Additional details can be added from an API call if needed
      });
    } catch {
      setUserDetails(null);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const token = getToken();

    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
      fetchUserDetails(decoded.id, token);
    } else {
      setUser(null);
      setUserDetails(null);
    }
  }, [pathname]);

  // ✅ NEW: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // ✅ Updated: Use clearTokenCookie
  const handleLogout = () => {
    clearTokenCookie();
    setUser(null);
    setUserDetails(null);
    router.push("/");
  };

  if (!isClient) return null;

  // ✅ Check if we're on admin page
  const isAdminPage = pathname === "/admin";
  const isVendorPage = pathname === "/vendor";

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 py-3 md:py-4 max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
            <img 
              src="/bazara-logo.jpeg" 
              alt="Bazara Logo"
              className="w-8 md:w-10 h-8 md:h-10 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-sm md:text-lg text-gray-900">Bazara</h1>
              <p className="text-xs text-gray-600 -mt-1">Industrial B2B</p>
            </div>
          </div>
        </Link>

        {/* Right Side Navigation */}
        <div className="flex gap-2 md:gap-4 items-center">

          {/* Admin Dashboard Link */}
          {user?.role === "ADMIN" && !isAdminPage && (
            <Link href="/admin">
              <button className="hidden sm:block text-gray-700 hover:text-orange-600 font-semibold transition px-2 md:px-3 py-2 text-sm md:text-base">
                Dashboard
              </button>
            </Link>
          )}

          {/* Back to Home Link (from Admin) */}
          {user?.role === "ADMIN" && isAdminPage && (
            <button
              onClick={() => router.push("/")}
              className="hidden sm:block text-gray-700 hover:text-orange-600 font-semibold transition px-2 md:px-3 py-2 text-sm md:text-base"
            >
              Home
            </button>
          )}

          {/* Vendor Store Link */}
          {user?.role === "VENDOR" && !isVendorPage && (
            <Link href="/vendor">
              <button className="hidden sm:block text-gray-700 hover:text-orange-600 font-semibold transition px-2 md:px-3 py-2 text-sm md:text-base">
                My Store
              </button>
            </Link>
          )}

          {/* Back to Home Link (from Vendor) */}
          {user?.role === "VENDOR" && isVendorPage && (
            <button
              onClick={() => router.push("/")}
              className="hidden sm:block text-gray-700 hover:text-orange-600 font-semibold transition px-2 md:px-3 py-2 text-sm md:text-base"
            >
              Home
            </button>
          )}

          {/* Cart Link (for logged-in clients) */}
          {user?.role === "CLIENT" && (
            <Link href="/cart">
              <button className="hidden sm:block text-gray-700 hover:text-orange-600 font-semibold transition px-2 md:px-3 py-2 text-sm md:text-base">
                🛒 Cart
              </button>
            </Link>
          )}

          {/* Not logged in */}
          {!user && (
            <>
              <Link href="/login">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 md:px-6 py-2 rounded-lg font-semibold transition shadow-md text-sm md:text-base">
                  Login
                </button>
              </Link>

              <Link href="/register">
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-6 py-2 rounded-lg font-semibold transition shadow-md text-sm md:text-base">
                  Signup
                </button>
              </Link>
            </>
          )}

          {/* Logged in - Profile Dropdown */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              {/* Profile Icon Button */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold transition shadow-md text-base md:text-lg"
              >
                👤
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white rounded-lg shadow-2xl z-50 border border-orange-200 backdrop-blur-sm">
                  <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Profile Details</h3>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Role Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 font-semibold">Role:</span>
                      <span className={`px-3 sm:px-4 py-2 rounded-full font-bold text-white text-xs sm:text-sm ${
                        user.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                        user.role === 'VENDOR' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                        'bg-gradient-to-r from-green-600 to-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    {/* User ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 font-semibold">User ID:</span>
                      <span className="text-xs sm:text-sm font-mono bg-gray-100 px-2 sm:px-3 py-1 rounded-lg text-gray-900">{user.id}</span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-300 pt-4">
                      <p className="text-xs text-gray-500 text-center mb-4">
                        Logged in to your {user.role.toLowerCase()} account
                      </p>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 rounded-lg transition shadow-md transform hover:scale-105 text-sm sm:text-base"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}