"use client";

import Link from "next/link";
import Icon from "./Icons";
import WishlistButton from "./wishlist/WishlistButton";

function getPrice(product) {
  const value = product.finalPrice ?? product.basePrice;
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
}

export default function ProductCard({ product, viewerRole, inCart, onAddToCart }) {
  const price = getPrice(product);
  const image = Array.isArray(product.images) ? product.images.find(Boolean) : null;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-red-500/35 hover:shadow-2xl hover:shadow-red-950/20">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-[#171719] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-600">
        {image ? (
          // Product images can originate from the configured API host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name || "Product"} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-400">
            <Icon name="package" className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Image coming soon</span>
          </span>
        )}
        {product.category && <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">{product.category}</span>}
      </Link>
      <span className="absolute right-3 top-3 z-10"><WishlistButton product={product} viewerRole={viewerRole} compact /></span>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.id}`} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-orange-700">{product.name || "Unnamed product"}</h3>
        </Link>
        {product.description && <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-slate-500">{product.description}</p>}

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Starting price</p>
              <p className={`mt-1 font-bold ${price ? "text-lg text-red-400" : "text-sm text-orange-700"}`}>{price || "Contact supplier"}</p>
            </div>
            {product.moq !== null && product.moq !== undefined && product.moq !== "" && (
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Minimum order</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{product.moq} units</p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Link href={`/product/${product.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
              View details
            </Link>
            {viewerRole === "CLIENT" && (
              inCart ? (
                <Link href="/cart" aria-label={`View ${product.name || "product"} in cart`} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Icon name="cart" /></Link>
              ) : (
                <button type="button" onClick={() => onAddToCart(product)} aria-label={`Add ${product.name || "product"} to cart`} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-red-950/30 transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"><Icon name="cart" /></button>
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
