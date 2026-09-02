"use client";

import Link from "next/link";
import Icon from "../Icons";
import QuantitySelector from "./QuantitySelector";
import { formatPrice, getUnitPrice, hasPrice } from "./pricing";

export default function ProductBuyBox({ product, quantity, onQuantityChange, viewerRole, cartLoading, onAddToCart, onOpenInquiry }) {
  const moq = Math.max(1, Number(product.moq) || 1);
  const unitPrice = getUnitPrice(product, quantity);
  const total = hasPrice(unitPrice) ? Number(unitPrice) * Number(quantity) : null;
  const isClient = viewerRole === "CLIENT";
  const isGuest = !viewerRole;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6 lg:sticky lg:top-44">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold text-slate-500">Price per unit</p>
        {hasPrice(unitPrice) ? <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{formatPrice(unitPrice)}</p> : <p className="mt-2 text-xl font-bold text-orange-700">Contact Supplier for Price</p>}
        {hasPrice(unitPrice) && <p className="mt-2 text-xs text-slate-500">Applicable at the selected quantity</p>}
      </div>

      <div className="py-5">
        <QuantitySelector quantity={quantity} moq={moq} onChange={onQuantityChange} disabled={cartLoading} />
        {hasPrice(total) && <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">Estimated item total</span><strong className="text-right text-sm text-slate-950">{formatPrice(total)}</strong></div>}
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-5">
        {isClient && <>
          <button type="button" onClick={onAddToCart} disabled={cartLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"><Icon name="cart" />{cartLoading ? "Adding to cart…" : "Add to cart"}</button>
          <button type="button" onClick={onOpenInquiry} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-800 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"><Icon name="quote" />Contact supplier</button>
        </>}
        {isGuest && <>
          <Link href="/login" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Sign in to add to cart</Link>
          <Link href="/login" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Sign in to contact supplier</Link>
        </>}
        {!isGuest && !isClient && <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">Purchasing and supplier-enquiry actions are available to buyer accounts.</div>}
      </div>
    </aside>
  );
}
