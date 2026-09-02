"use client";

import Link from "next/link";
import { useState } from "react";

const items = [["overview","Overview"],["profile","Profile"],["wishlist","Saved Products"],["rfqs","My RFQs"],["inquiries","My Inquiries"],["cart","Cart"]];

export default function AccountShell({ active, onNavigate, children }) {
  const [open, setOpen] = useState(false);
  const nav = <nav aria-label="Buyer account navigation" className="space-y-1">{items.map(([id,label]) => <button key={id} type="button" onClick={() => { onNavigate(id); setOpen(false); }} aria-current={active === id ? "page" : undefined} className={`min-h-11 w-full rounded-xl px-4 text-left text-sm font-bold focus-visible:outline-2 focus-visible:outline-orange-600 ${active === id ? "bg-orange-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{label}</button>)}</nav>;
  return <main className="min-h-screen bg-slate-50 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="marketplace-container flex items-center justify-between gap-4 py-5"><div><p className="marketplace-eyebrow">Buyer account</p><h1 className="mt-1 text-2xl font-bold">My Bazara</h1></div><div className="flex gap-2"><Link href="/products" className="marketplace-button-secondary hidden sm:inline-flex">Browse products</Link><button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold lg:hidden" aria-expanded={open}>Menu</button></div></div></header>{open && <div className="fixed inset-0 z-[80] bg-slate-950/50 lg:hidden" role="dialog" aria-modal="true" aria-label="Buyer account navigation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><aside className="ml-auto h-full w-[min(88vw,22rem)] bg-white p-5 shadow-2xl"><div className="mb-6 flex items-center justify-between"><strong>My account</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="h-10 w-10 rounded-full bg-slate-100 text-xl">×</button></div>{nav}</aside></div>}<div className="marketplace-container grid gap-7 py-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-10"><aside className="hidden self-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:block">{nav}</aside><div className="min-w-0">{children}</div></div></main>;
}
