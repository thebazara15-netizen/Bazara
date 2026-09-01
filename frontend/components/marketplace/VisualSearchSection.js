"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icons";

export default function VisualSearchSection({ viewerRole }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <section id="visual-search" className="scroll-mt-48 bg-white py-14 sm:py-16">
      <div className="marketplace-container">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-slate-300 sm:px-10 sm:py-14 lg:px-16">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#fb923c_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[42px] border-indigo-500/20" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Bazara visual product search</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Find products instantly</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">Search the marketplace using a product image and discover similar products from Bazara suppliers.</p>
              <p className="mt-4 inline-flex rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-200">Visual product matching — coming soon</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => setOpen(true)} className="marketplace-button-primary">Search by image <Icon name="search" className="h-4 w-4" /></button>
                {viewerRole === "CLIENT" && <Link href="/account" className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10">Saved products</Link>}
                <Link href="/products" className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10">Search products</Link>
              </div>
            </div>
            <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-3xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur">
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/30 bg-indigo-950/60">
                <div className="text-center"><Icon name="package" className="mx-auto h-14 w-14 text-orange-300" /><p className="mt-4 text-sm font-semibold text-slate-200">Image-led product discovery</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {open && <div role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)} className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="visual-search-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="marketplace-eyebrow">Coming soon</p><h3 id="visual-search-title" className="mt-2 text-xl font-bold text-slate-950">Visual Search is in development</h3></div><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close Visual Search information" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orange-600"><Icon name="close" /></button></div><p className="mt-4 text-sm leading-6 text-slate-600">Bazara is preparing image-based product matching. No image is uploaded or processed from this preview.</p><Link href="/products" onClick={() => setOpen(false)} className="marketplace-button-primary mt-6">Browse products instead</Link></div></div>}
    </section>
  );
}
