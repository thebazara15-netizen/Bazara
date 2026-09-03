import Icon from "./Icons";

const values = [
  { icon: "package", title: "Bulk / MOQ pricing", description: "Review minimum quantities and volume pricing." },
  { icon: "storefront", title: "Direct enquiries", description: "Begin relevant supplier conversations." },
  { icon: "quote", title: "Request quotations", description: "Post requirements for suppliers to quote." },
  { icon: "categories", title: "Supplier discovery", description: "Explore businesses across supply categories." },
];

export default function ValueSection() {
  return (
    <section className="py-4 sm:py-5">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((item) => <article key={item.title} className="flex items-center gap-3 bg-[#101012] p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Icon name={item.icon} /></span><div><h3 className="text-sm font-bold text-slate-100">{item.title}</h3><p className="mt-1 text-xs leading-4 text-slate-500">{item.description}</p></div></article>)}
      </div>
    </section>
  );
}
