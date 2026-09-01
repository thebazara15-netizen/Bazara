import Link from "next/link";
import Icon from "./Icons";

export default function RfqBanner() {
  return (
    <section className="py-14 sm:py-16">
      <div className="marketplace-container">
        <div className="grid overflow-hidden rounded-3xl bg-orange-700 text-white shadow-xl shadow-orange-900/10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">Request for quotation</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">Can&apos;t find the right product?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">Post your requirement and give suppliers the information they need to prepare quotations.</p>
          </div>
          <div className="border-t border-white/15 p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <Link href="/rfq" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-orange-800 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:w-auto">Post an RFQ <Icon name="arrow" className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
