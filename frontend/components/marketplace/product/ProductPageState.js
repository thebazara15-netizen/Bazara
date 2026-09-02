import Link from "next/link";
import Icon from "../Icons";

export function ProductLoadingState() {
  return <main className="min-h-screen bg-slate-50"><div className="marketplace-container py-8"><div className="grid gap-8 lg:grid-cols-2"><div className="aspect-square animate-pulse rounded-2xl bg-slate-200" /><div className="space-y-5"><div className="h-5 w-32 animate-pulse rounded bg-slate-200" /><div className="h-12 w-full animate-pulse rounded bg-slate-200" /><div className="h-7 w-1/2 animate-pulse rounded bg-slate-200" /><div className="h-80 animate-pulse rounded-2xl bg-white" /></div></div></div></main>;
}

export function ProductUnavailableState({ type }) {
  const isError = type === "error";
  const isInvalid = type === "invalid";
  return <main className="min-h-[70vh] bg-slate-50"><div className="marketplace-container flex min-h-[70vh] items-center justify-center py-12"><section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="package" className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-bold text-slate-950">{isError ? "Product details could not be loaded" : isInvalid ? "Invalid product address" : "Product not found"}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{isError ? "The marketplace API did not return product information. Please try again shortly." : isInvalid ? "The product ID in this address is not valid." : "This product may no longer be listed, or the address may be incorrect."}</p><Link href="/products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Browse products</Link></section></div></main>;
}
