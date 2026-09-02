import Link from "next/link";

const columns = [
  { title: "For buyers", links: [{ label: "Browse products", href: "/products" }, { label: "Suppliers", href: "/suppliers" }, { label: "Post an RFQ", href: "/rfq" }, { label: "Cart", href: "/cart" }] },
  { title: "For sellers", links: [{ label: "Register as supplier", href: "/register" }, { label: "Vendor dashboard", href: "/vendor" }] },
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Register", href: "/register" }] },
];

export default function MarketplaceFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="marketplace-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-16">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-lg font-black">B</span><span><strong className="block text-lg">Bazara</strong><span className="text-xs text-slate-400">Business marketplace</span></span></Link>
          <p className="mt-5 text-sm leading-6 text-slate-400">A marketplace for discovering products, suppliers, and sourcing opportunities across Indian businesses.</p>
        </div>
        {columns.map((column) => <div key={column.title}><h2 className="text-sm font-bold text-white">{column.title}</h2><ul className="mt-4 space-y-3">{column.links.map((link) => <li key={link.label}><Link href={link.href} className="text-sm text-slate-400 transition hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400">{link.label}</Link></li>)}</ul></div>)}
      </div>
      <div className="border-t border-white/10"><div className="marketplace-container py-5 text-xs text-slate-500">© {new Date().getFullYear()} Bazara. B2B marketplace.</div></div>
    </footer>
  );
}
