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
      className={`relative flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-slate-200 transition hover:bg-white/10 hover:text-white ${
        active ? "bg-white/10 text-orange-300" : ""
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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b10]/95 text-white shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap md:px-6">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-600 to-red-700 shadow-lg shadow-orange-950/30">
            <img
              src="/bazara-logo.jpeg"
              alt="Bazara Logo"
              className="h-9 w-9 object-contain mix-blend-screen"
            />
          </span>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-5 text-white">Bazara</h1>
            <p className="text-xs font-medium text-slate-400">Industrial B2B</p>
          </div>
        </Link>

        <form
          onSubmit={handleSearch}
          className="order-3 w-full md:order-2 md:mx-6 md:max-w-2xl md:flex-1"
        >
          <div className="flex h-12 overflow-hidden rounded-full border border-white/10 bg-white/[0.08] shadow-inner shadow-black/20 focus-within:border-orange-400/70 focus-within:ring-2 focus-within:ring-orange-500/20">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products or category"
              className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="flex w-16 items-center justify-center bg-gradient-to-r from-orange-600 to-red-600 text-white transition hover:from-orange-500 hover:to-red-500"
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="order-2 flex items-center gap-1 md:order-3">
          <div className="hidden items-center gap-1 lg:flex">
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
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Dashboard
            </Link>
          )}

          {user?.role === "ADMIN" && isAdminPage && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Home
            </button>
          )}

          {user?.role === "VENDOR" && !isVendorPage && (
            <Link
              href="/vendor"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:block"
            >
              My Store
            </Link>
          )}

          {user?.role === "VENDOR" && isVendorPage && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Home
            </button>
          )}

          <Link href="/cart" aria-label="Cart">
            <span className="relative flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-slate-200 transition hover:bg-white/10 hover:text-white">
              <Icon name="cart" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white ring-2 ring-[#070b10]">
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
                      className="mt-4 block rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-5 py-2.5 text-center text-sm font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:from-orange-500 hover:to-red-500"
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
                          className="block py-2 text-sm font-medium text-gray-700 transition hover:text-orange-600"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <Link
                      href="/register"
                      onClick={() => setShowProfileDropdown(false)}
                      className="mt-2 block rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold text-gray-800 transition hover:bg-orange-50 hover:text-orange-600"
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
                          className="block py-2 text-sm font-medium text-gray-700 transition hover:text-orange-600"
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
