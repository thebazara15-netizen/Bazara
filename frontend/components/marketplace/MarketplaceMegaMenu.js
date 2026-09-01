"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icons";

const suggestions = ["Industrial Equipment", "Electrical & Electronics", "Environmental Equipment", "Machinery", "Tools & Hardware", "Components", "Safety Equipment", "Packaging", "Instrumentation"];

export default function MarketplaceMegaMenu({ open, onClose, viewerRole, mobile = false }) {
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState("");
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    fetch("/api/products/meta/categories")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (!cancelled) setCategories(Array.isArray(data) ? data.filter(Boolean) : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [loaded, open]);

  const displayed = categories.length ? categories : suggestions;
  const selected = active || displayed[0];

  useEffect(() => {
    if (!open) return undefined;
    if (mobile) closeRef.current?.focus();
    const handleEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobile, onClose, open]);

  if (!open) return null;
  const roleLink = viewerRole === "CLIENT" ? { href: "/account", label: "Saved products" } : viewerRole === "VENDOR" ? { href: "/vendor", label: "Vendor dashboard" } : viewerRole === "ADMIN" ? { href: "/admin", label: "Admin dashboard" } : null;

  return (
    <div id={mobile ? "mobile-category-panel" : "category-mega-menu"} className={mobile ? "fixed inset-0 z-[90] overflow-y-auto bg-white p-4" : "absolute inset-x-0 top-full z-50 border-y border-slate-200 bg-white shadow-2xl shadow-slate-900/15"}>
      <div className={mobile ? "mx-auto max-w-7xl" : "marketplace-container py-6"}>
        {mobile && <div className="mb-5 flex items-center justify-between"><div><p className="marketplace-eyebrow">Marketplace discovery</p><h2 className="mt-1 text-xl font-bold">All categories</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close categories" className="rounded-xl p-3 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orange-600"><Icon name="close" /></button></div>}
        <div className={mobile ? "grid gap-6" : "grid grid-cols-[18rem_1fr] overflow-hidden rounded-2xl border border-slate-200"}>
          <div className={mobile ? "" : "max-h-[25rem] overflow-y-auto border-r border-slate-200 bg-slate-50 p-3"}>
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">{categories.length ? "Categories for you" : "Suggested categories"}</p>
            <div className={mobile ? "grid grid-cols-2 gap-2" : "space-y-1"}>{displayed.map((category, index) => <button key={category} type="button" onMouseEnter={() => setActive(category)} onFocus={() => setActive(category)} onClick={() => mobile ? setActive(category) : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-orange-600 ${selected === category ? "bg-orange-600 text-white" : "text-slate-700 hover:bg-white"}`}><Icon name={index % 2 ? "package" : "categories"} className="h-4 w-4 shrink-0" /><span>{category}</span></button>)}</div>
            {!categories.length && <p className="mt-3 px-3 text-xs leading-5 text-slate-500">Discovery suggestions only; they do not indicate available product counts.</p>}
          </div>
          <div className={mobile ? "" : "p-7"}>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Browse selected category</p><h3 className="mt-2 text-2xl font-bold text-slate-950">{selected}</h3><p className="mt-2 text-sm text-slate-600">Explore matching products and supplier listings across the marketplace.</p>
            <Link onClick={onClose} href={`/products?category=${encodeURIComponent(selected)}`} className="marketplace-button-primary mt-5">Browse category <Icon name="arrow" className="h-4 w-4" /></Link>
            <div className="mt-7 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
              <div><h4 className="text-sm font-bold text-slate-950">For buyers</h4><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link onClick={onClose} href="/products" className="hover:text-orange-700">All products</Link><Link onClick={onClose} href="/rfq" className="hover:text-orange-700">Post buy requirement</Link>{viewerRole === "CLIENT" && <Link onClick={onClose} href="/account" className="hover:text-orange-700">Saved products</Link>}</div></div>
              <div><h4 className="text-sm font-bold text-slate-950">For suppliers</h4><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link onClick={onClose} href="/suppliers" className="hover:text-orange-700">View all suppliers</Link><Link onClick={onClose} href={viewerRole === "VENDOR" ? "/vendor" : "/register"} className="hover:text-orange-700">{viewerRole === "VENDOR" ? "Vendor dashboard" : "Join as supplier"}</Link></div></div>
              <div><h4 className="text-sm font-bold text-slate-950">Marketplace services</h4><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link onClick={onClose} href="/#visual-search" className="hover:text-orange-700">Visual search preview</Link>{roleLink && <Link onClick={onClose} href={roleLink.href} className="hover:text-orange-700">{roleLink.label}</Link>}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
