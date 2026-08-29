"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearTokenCookie, decodeToken, getToken } from "../utils/auth";

const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;

const menuItems = [
  { label: "My Bazara", href: "/" },
  { label: "Orders", href: "/cart" },
  { label: "Messages", href: "/" },
  { label: "RFQs", href: "/" },
  { label: "Favorites", href: "/" },
  { label: "Account", href: "/" },
];

function Icon({ name, className = "h-6 w-6" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  };

  if (name === "globe") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20" />
        <path d="M12 2a15.3 15.3 0 0 0 0 20" />
      </svg>
    );
  }

  if (name === "message") {
    return (
      <svg {...common}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <path d="M9 5h6" />
        <path d="M9 3h6v4H9z" />
        <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
        <path d="M8 12h8" />
        <path d="M8 16h6" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg {...common}>
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M2 3h3l3 12h10l3-8H7" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...common}>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function NavIconButton({ children, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 ${
        active ? "border-blue-200 bg-blue-50 text-blue-600" : ""
      }`}
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [socialProviders, setSocialProviders] = useState({});
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const user = token ? decodeToken(token) : null;
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const socialLoginUrl = (provider) => `${API}/api/auth/${provider}`;
  const userName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    (user?.id ? `User ${user.id}` : "there");

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

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!token || user?.role !== "CLIENT") {
        setCartCount(0);
        return;
      }

      try {
        const res = await fetch(`${API}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setCartCount(0);
          return;
        }

        const data = await res.json();
        const count = Array.isArray(data)
          ? data.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
          : 0;

        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    fetchCartCount();

    window.addEventListener("focus", fetchCartCount);
    window.addEventListener("cart:changed", fetchCartCount);

    return () => {
      window.removeEventListener("focus", fetchCartCount);
      window.removeEventListener("cart:changed", fetchCartCount);
    };
  }, [API, token, user?.role]);

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

  const handleLogout = () => {
    clearTokenCookie();
    setShowProfileDropdown(false);
    router.push("/");
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/?search=${encodeURIComponent(query)}` : "/");
  };

  const isAdminPage = pathname === "/admin";
  const isVendorPage = pathname === "/vendor";

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 md:flex-nowrap md:px-6">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
            <img
              src="/bazara-logo.jpeg"
              alt="Bazara Logo"
              className="h-8 w-8 object-contain"
            />
          </span>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-5 text-blue-600">Bazara</h1>
            <p className="text-xs font-medium text-gray-500">Industrial B2B</p>
          </div>
        </Link>

        <form
          onSubmit={handleSearch}
          className="order-3 w-full md:order-2 md:mx-6 md:max-w-2xl md:flex-1"
        >
          <div className="flex h-10 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products or category"
              className="min-w-0 flex-1 bg-transparent px-5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="flex w-14 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700"
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="order-2 flex items-center gap-1 md:order-3">
          <div className="hidden items-center gap-1 lg:flex">
            <Link
              href="/suppliers"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600"
            >
              Suppliers
            </Link>
            <Link
              href="/rfq"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600"
            >
              RFQ
            </Link>
            <NavIconButton label="Language and currency">
              <Icon name="globe" />
              <span className="ml-2 text-sm font-medium">English-INR</span>
            </NavIconButton>
            <NavIconButton label="Messages">
              <Icon name="message" />
            </NavIconButton>
            <NavIconButton label="Orders">
              <Icon name="orders" />
            </NavIconButton>
          </div>

          {user?.role === "ADMIN" && !isAdminPage && (
            <Link
              href="/admin"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 sm:block"
            >
              Dashboard
            </Link>
          )}

          {user?.role === "ADMIN" && isAdminPage && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 sm:block"
            >
              Home
            </button>
          )}

          {user?.role === "VENDOR" && !isVendorPage && (
            <Link
              href="/vendor"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 sm:block"
            >
              My Store
            </Link>
          )}

          {user?.role === "VENDOR" && isVendorPage && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 sm:block"
            >
              Home
            </button>
          )}

          <Link href="/cart" aria-label="Cart">
            <span className="relative flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-gray-700 transition hover:bg-gray-50 hover:text-blue-600">
              <Icon name="cart" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white ring-2 ring-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <span className="ml-2 hidden text-sm font-semibold sm:inline">Cart</span>
            </span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <NavIconButton
              label={user ? "Open account menu" : "Open sign in menu"}
              active={showProfileDropdown}
              onClick={() => setShowProfileDropdown((current) => !current)}
            >
              <Icon name="user" />
              {!user && <span className="ml-2 hidden text-sm font-medium sm:inline">Sign in</span>}
            </NavIconButton>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-3 w-[min(92vw,23rem)] rounded-xl border border-slate-200 bg-white text-gray-950 shadow-2xl">
                <span className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white" />

                {!user ? (
                  <div className="p-5">
                    <h2 className="text-base font-extrabold">Sign back in</h2>
                    <Link
                      href="/login"
                      onClick={() => setShowProfileDropdown(false)}
                      className="mt-4 block rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Sign in
                    </Link>

                    {Object.values(socialProviders).some(Boolean) && (
                      <>
                        <p className="mt-4 text-center text-xs font-medium text-gray-500">Or continue with</p>
                        <div className="mt-3 flex items-center justify-center gap-5">
                          {socialProviders.facebook && (
                            <a
                              href={socialLoginUrl("facebook")}
                              aria-label="Continue with Facebook"
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-2xl font-bold text-white shadow-sm transition hover:scale-105"
                            >
                              f
                            </a>
                          )}
                          {socialProviders.google && (
                            <a
                              href={socialLoginUrl("google")}
                              aria-label="Continue with Google"
                              className="text-4xl font-bold leading-none transition hover:scale-105"
                            >
                              <span className="text-[#4285f4]">G</span>
                            </a>
                          )}
                          {socialProviders.linkedin && (
                            <a
                              href={socialLoginUrl("linkedin")}
                              aria-label="Continue with LinkedIn"
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2867b2] text-base font-bold text-white shadow-sm transition hover:scale-105"
                            >
                              in
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    <p className="mt-4 text-xs leading-5 text-gray-500">
                      By signing in, you agree to the{" "}
                      <span className="underline">Bazara Membership Agreement</span> and{" "}
                      <span className="underline">Privacy Policy</span>.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 border-t border-gray-200 pt-3">
                      {menuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setShowProfileDropdown(false)}
                          className="block py-2 text-sm font-medium text-gray-700 transition hover:text-blue-600"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <Link
                      href="/register"
                      onClick={() => setShowProfileDropdown(false)}
                      className="mt-2 block rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold text-gray-800 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      Membership program
                    </Link>
                  </div>
                ) : (
                  <div className="p-5">
                    <h2 className="text-base font-extrabold">Hi, {userName}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 border-t border-gray-200 pt-3">
                      {menuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setShowProfileDropdown(false)}
                          className="block py-2 text-sm font-medium text-gray-700 transition hover:text-blue-600"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg px-3 py-2 text-left text-sm font-bold text-gray-800 transition hover:bg-red-50 hover:text-red-600"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
