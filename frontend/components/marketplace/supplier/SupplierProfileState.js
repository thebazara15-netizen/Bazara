import Link from "next/link";
import Icon from "../Icons";

export function SupplierProfileLoading() {
  return <main className="min-h-screen bg-slate-50"><div className="marketplace-container py-8"><div className="h-72 animate-pulse rounded-3xl bg-slate-200" /><div className="mt-8 grid gap-5 lg:grid-cols-3"><div className="h-56 animate-pulse rounded-2xl bg-white lg:col-span-2" /><div className="h-56 animate-pulse rounded-2xl bg-white" /></div></div></main>;
}

export function SupplierProfileUnavailable({ type }) {
  const isInvalid = type === "invalid";
  const isError = type === "error";
  return <main className="min-h-[70vh] bg-slate-50"><div className="marketplace-container flex min-h-[70vh] items-center justify-center py-12"><section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="storefront" className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-bold text-slate-950">{isInvalid ? "Invalid supplier address" : isError ? "Supplier profile could not be loaded" : "Supplier not found"}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{isInvalid ? "The supplier ID in this address is not valid." : isError ? "The supplier service is temporarily unavailable." : "This supplier storefront may no longer be available."}</p><Link href="/suppliers" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-orange-700">Browse suppliers</Link></section></div></main>;
}
