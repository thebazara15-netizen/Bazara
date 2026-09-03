import Link from "next/link";
import Image from "next/image";
import Icon from "./Icons";

export default function Hero() {
  return (
    <section className="marketplace-hero relative min-h-[34rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white lg:min-h-[38rem]">
      <div aria-hidden="true" className="absolute -left-24 top-1/2 h-56 w-56 rounded-full bg-red-600/10 blur-3xl" />
      <div className="grid min-h-[34rem] min-w-0 lg:min-h-[38rem] lg:grid-cols-[.92fr_1.08fr]">
        <div className="relative z-10 flex min-w-0 flex-col justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-14">
          <p className="marketplace-eyebrow">Built for business procurement</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
            Source smarter.<br/><span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Grow faster.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Discover real supplier listings, compare commercial requirements, and move from product search to supplier conversation in one focused marketplace.
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

        <div className="relative flex min-h-[19rem] min-w-0 max-w-full items-center justify-center overflow-hidden border-t border-white/10 px-2 py-5 sm:min-h-[23rem] sm:p-5 lg:min-h-[38rem] lg:border-l lg:border-t-0">
          <div className="absolute h-[20rem] w-[20rem] rounded-full bg-[#ff2f36] opacity-85 shadow-[0_0_110px_rgba(255,47,54,.5)] sm:h-[27rem] sm:w-[27rem] lg:h-[31rem] lg:w-[31rem]" />
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
          <Image src="/bazara-b2b-hero.svg" width={720} height={560} priority alt="Bazara marketplace network connecting suppliers, products, and business buyers" className="relative z-10 h-auto min-w-0 max-w-full drop-shadow-[0_28px_42px_rgba(0,0,0,.42)] lg:max-w-[42rem]" />
        </div>
      </div>
    </section>
  );
}
