"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clearTokenCookie, decodeToken, getToken } from "../utils/auth";
import Icon from "./marketplace/Icons";

const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;
const primaryLinks = [
  { label: "All categories", href: "/#categories", icon: "categories" },
  { label: "Featured products", href: "/#featured-products" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Post requirement", href: "/rfq" },
  { label: "Wholesale sourcing", href: "/#wholesale-deals" },
];

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const user = token ? decodeToken(token) : null;
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const closeAccount = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeAccount);
    return () => document.removeEventListener("mousedown", closeAccount);
  }, []);

  useEffect(() => {
    const loadCartCount = async () => {
      if (!token || user?.role !== "CLIENT") {
        setCartCount(0);
        return;
      }
      try {
        const response = await fetch(`${API}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return setCartCount(0);
        const items = await response.json();
        setCartCount(Array.isArray(items) ? items.reduce((total, item) => total + Number(item.quantity || 0), 0) : 0);
      } catch {
        setCartCount(0);
      }
    };
    loadCartCount();
    window.addEventListener("focus", loadCartCount);
    window.addEventListener("cart:changed", loadCartCount);
    return () => {
      window.removeEventListener("focus", loadCartCount);
      window.removeEventListener("cart:changed", loadCartCount);
    };
  }, [API, token, user?.role]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") || "").trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  const handleLogout = () => {
    clearTokenCookie();
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  };

  const dashboard = user?.role === "ADMIN" ? { label: "Admin dashboard", href: "/admin" } : user?.role === "VENDOR" ? { label: "Vendor dashboard", href: "/vendor" } : user?.role === "CLIENT" ? { label: "My account", href: "/account" } : null;
  const userName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl">
      <div className="hidden border-b border-slate-200 bg-slate-950 text-slate-300 md:block">
        <div className="marketplace-container flex min-h-9 items-center justify-between gap-6 text-xs">
          <p>Welcome to Bazara</p>
          <nav aria-label="Utility navigation" className="flex items-center gap-5">
            <Link href="/#featured-products" className="hover:text-white">For buyers</Link>
            <Link href="/suppliers" className="hover:text-white">For suppliers</Link>
            <Link href="/rfq" className="hover:text-white">RFQ</Link>
            <span className="text-slate-500">Help & support</span>
            {!user && <><Link href="/login" className="font-semibold text-white hover:text-orange-300">Sign in</Link><Link href="/register" className="font-semibold text-white hover:text-orange-300">Register</Link></>}
          </nav>
        </div>
      </div>

      <div className="marketplace-container flex flex-wrap items-center gap-3 py-3 lg:flex-nowrap lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-lg font-black text-white shadow-sm">B</span>
          <span className="hidden sm:block"><strong className="block text-lg leading-5 tracking-tight">Bazara</strong><span className="text-[11px] font-medium text-slate-500">Business marketplace</span></span>
        </Link>

        <form onSubmit={handleSearch} role="search" className="order-3 w-full lg:order-none lg:flex-1">
          <label htmlFor="marketplace-search" className="sr-only">Search products and categories</label>
          <div className="flex h-12 overflow-hidden rounded-xl border-2 border-slate-900 bg-white transition focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-100">
            <input key={searchParams.get("q") || ""} id="marketplace-search" name="q" type="search" defaultValue={searchParams.get("q") || ""} placeholder="Search products, machinery, components..." className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-slate-400" />
            <button type="submit" className="inline-flex w-14 items-center justify-center bg-slate-950 text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white" aria-label="Search products"><Icon name="search" /></button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {dashboard && <Link href={dashboard.href} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 md:block">{dashboard.label}</Link>}
          <Link href="/cart" aria-label={cartCount ? `Cart with ${cartCount} items` : "Cart"} className="relative flex h-11 min-w-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
            <Icon name="cart" className="h-6 w-6" />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <div ref={accountRef} className="relative">
            <button type="button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-label="Account menu" className="flex h-11 items-center gap-2 rounded-xl px-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:px-3"><Icon name="account" className="h-6 w-6" /><span className="hidden max-w-28 truncate text-sm font-bold sm:block">{user ? userName : "Sign in"}</span></button>
            {accountOpen && <div className="absolute right-0 top-[calc(100%+0.65rem)] w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15">
              {user ? <><div className="px-3 py-2"><p className="truncate text-sm font-bold text-slate-950">{userName}</p><p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{user.role?.toLowerCase()} account</p></div>{dashboard && <Link href={dashboard.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-100">{dashboard.label}</Link>}{user.role === "CLIENT" && <Link href="/cart" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-100">My cart</Link>}<button type="button" onClick={handleLogout} className="mt-1 w-full rounded-xl border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">Sign out</button></> : <><p className="px-3 py-2 text-sm text-slate-600">Sign in to manage enquiries and marketplace activity.</p><Link href="/login" className="mt-2 block rounded-xl bg-slate-950 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-orange-700">Sign in</Link><Link href="/register" className="mt-2 block rounded-xl px-4 py-2.5 text-center text-sm font-bold text-orange-700 hover:bg-orange-50">Create account</Link></>}
            </div>}
          </div>
          <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label="Toggle navigation" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 lg:hidden"><Icon name={mobileOpen ? "close" : "menu"} className="h-6 w-6" /></button>
        </div>
      </div>

      <nav aria-label="Marketplace navigation" className="hidden border-t border-slate-200 lg:block">
        <div className="marketplace-container flex h-11 items-center gap-7 overflow-x-auto">{primaryLinks.map((link) => <Link key={link.label} href={link.href} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-700">{link.icon && <Icon name={link.icon} className="h-4 w-4" />}{link.label}</Link>)}</div>
      </nav>
      {mobileOpen && <nav aria-label="Mobile marketplace navigation" className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden"><div className="mx-auto grid max-w-7xl gap-1">{primaryLinks.map((link) => <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-orange-700">{link.icon && <Icon name={link.icon} className="h-4 w-4" />}{link.label}</Link>)}</div></nav>}
    </header>
  );
}

export default function Navbar() {
  return <Suspense fallback={<div className="h-[7.25rem] border-b border-slate-200 bg-white md:h-[9.5rem]" />}><NavbarContent /></Suspense>;
}
