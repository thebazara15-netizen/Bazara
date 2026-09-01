import Icon from "./Icons";
import SectionHeader from "./SectionHeader";

const values = [
  { icon: "package", title: "Bulk & wholesale pricing", description: "Review available MOQs and volume pricing information on product listings." },
  { icon: "storefront", title: "Direct supplier enquiries", description: "Use product and supplier profiles to begin relevant business conversations." },
  { icon: "quote", title: "Request for quotations", description: "Post sourcing requirements for suppliers to review and quote against." },
  { icon: "categories", title: "Business supplier network", description: "Discover companies across industrial and commercial supply categories." },
];

export default function ValueSection() {
  return (
    <section id="wholesale-deals" className="scroll-mt-44 py-14 sm:py-16">
      <SectionHeader eyebrow="Why Bazara" title="Built around practical B2B sourcing" description="Tools and discovery paths for buyers and suppliers doing business at scale." />
      <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((item) => <article key={item.title} className="bg-white p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><Icon name={item.icon} /></span><h3 className="mt-5 font-bold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></article>)}
      </div>
    </section>
  );
}
