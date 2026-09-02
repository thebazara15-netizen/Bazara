import Link from "next/link";
import Icon from "./Icons";

const sourcingSteps = [
  { number: "01", label: "Discover products" },
  { number: "02", label: "Compare requirements" },
  { number: "03", label: "Connect with suppliers" },
];

export default function Hero() {
  return (
    <section className="marketplace-hero overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="grid lg:grid-cols-[1.3fr_0.7fr]">
        <div className="px-5 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <p className="marketplace-eyebrow">Built for business procurement</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Source products. Connect with suppliers. <span className="text-orange-700">Grow your business.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            A focused B2B marketplace for Indian manufacturers, traders, wholesalers, distributors, and industrial buyers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className="marketplace-button-primary">
              Browse products <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link href="/rfq" className="marketplace-button-secondary">
              Post an RFQ
            </Link>
          </div>
        </div>

        <div className="relative border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-9 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">How sourcing works</span>
              <h2 className="mt-5 text-2xl font-semibold">Move from requirement to supplier conversation.</h2>
            </div>
            <ol className="mt-10 space-y-3">
              {sourcingSteps.map((step) => (
                <li key={step.number} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4">
                  <span className="font-mono text-xs font-bold text-orange-300">{step.number}</span>
                  <span className="text-sm font-semibold text-slate-100">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
