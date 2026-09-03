import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin" },
  { label: "Pricing", href: "/admin" },
  { label: "Orders", href: "/admin" }
];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-56 shrink-0 border-r border-gray-200 bg-white p-4 md:block lg:w-64 lg:p-6">
      <div className="mb-6">
        <p className="text-lg font-bold text-blue-600">Bazara Admin</p>
        <p className="mt-1 text-xs font-medium text-gray-500">Marketplace operations</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
