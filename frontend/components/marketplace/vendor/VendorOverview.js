const cards = [
  ["products", "Total Products", "products"], ["inquiries", "Buyer Inquiries", "inquiries"],
  ["rfqs", "Open RFQs", "rfqs"], ["quotes", "My Quotations", "quotes"]
];

export default function VendorOverview({ counts, onNavigate }) {
  return <section><p className="marketplace-eyebrow">Business overview</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Your seller activity</h2><p className="mt-3 text-sm text-slate-600">Live counts from your product, inquiry, and sourcing APIs.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([key, label, target]) => <button type="button" key={key} onClick={() => onNavigate(target)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"><span className="text-sm font-semibold text-slate-500">{label}</span><strong className="mt-4 block text-3xl font-bold text-slate-950">{counts[key]}</strong><span className="mt-3 block text-xs font-bold text-orange-700">View details →</span></button>)}</div></section>;
}
