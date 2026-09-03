import Link from "next/link";
import Icon from "./Icons";

export default function IndiaSourcingSection({ viewerRole }) {
  const sellerHref = viewerRole === "VENDOR" ? "/vendor" : "/register";
  const sellerLabel = viewerRole === "VENDOR" ? "Vendor dashboard" : "Register as supplier";

  return (
    <section id="wholesale-deals" className="scroll-mt-48 bg-slate-100/70 py-14 sm:py-16">
      <div className="marketplace-container grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-red-400/20 bg-[linear-gradient(125deg,#3a090d,#d71928)] p-7 text-white sm:p-10">
          <div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">India-first B2B sourcing</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Find distributors across India</h2><p className="mt-4 max-w-lg leading-7 text-orange-50">Expand your brand into new markets and build supplier relationships through a focused business marketplace.</p><Link href="/suppliers" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50">Explore suppliers <Icon name="arrow" className="h-4 w-4" /></Link></div>
          <svg aria-hidden="true" viewBox="0 0 420 260" className="absolute -bottom-6 -right-16 w-[28rem] max-w-[75%] text-orange-200/30"><path fill="currentColor" d="M182 15c26 11 47 28 72 31 31 4 59 15 77 40 20 28 13 57 30 84 11 18 31 31 28 52-4 24-34 27-56 22-29-7-50-25-78-31-38-8-81 2-112-20-27-20-29-58-19-88 9-28 27-51 31-80 1-10 12-14 27-10Z"/><circle cx="117" cy="170" r="11" fill="currentColor"/><circle cx="297" cy="91" r="8" fill="currentColor"/><path d="M117 170c55-54 116-70 180-79" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="9 10"/></svg>
        </article>
        <div className="grid gap-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-7"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><Icon name="search" /></span><h3 className="mt-5 text-xl font-bold text-slate-950">Looking for a product?</h3><p className="mt-2 text-sm leading-6 text-slate-600">Post your sourcing requirement and receive quotations from suppliers.</p><Link href="/rfq" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800">Post buy requirement <Icon name="arrow" className="h-4 w-4" /></Link></article>
          <article className="relative overflow-hidden rounded-3xl border border-red-500/25 bg-[linear-gradient(135deg,#161616,#31090d)] p-7 text-white"><div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[18px] border-red-500/20"/><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-400"><Icon name="storefront" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-red-400">Sell with BAZARA</p><h3 className="mt-2 text-xl font-bold">Showcase products to business buyers.</h3><Link href={sellerHref} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300">{sellerLabel} <Icon name="arrow" className="h-4 w-4" /></Link></article>
        </div>
      </div>
    </section>
  );
}
