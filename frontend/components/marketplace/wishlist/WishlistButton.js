"use client";

import { useWishlist } from "./WishlistProvider";

export default function WishlistButton({ product, viewerRole, compact = false }) {
  const { savedIds, pending, toggle } = useWishlist();
  if (viewerRole && viewerRole !== "CLIENT") return null;
  const saved = savedIds.has(Number(product.id));
  const busy = pending.has(Number(product.id));
  return <button type="button" disabled={busy} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle(product); }} aria-pressed={saved} aria-label={`${saved ? "Remove" : viewerRole === "CLIENT" ? "Save" : "Sign in to save"} ${product.name || "product"}`} className={`${compact ? "h-10 w-10 rounded-full" : "min-h-11 rounded-xl px-4"} inline-flex items-center justify-center gap-2 border border-slate-300 bg-white font-bold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600`}><span aria-hidden="true" className={saved ? "text-rose-600" : ""}>{saved ? "♥" : "♡"}</span>{!compact && <span className="text-sm">{saved ? "Saved" : viewerRole === "CLIENT" ? "Save product" : "Sign in to save"}</span>}</button>;
}
