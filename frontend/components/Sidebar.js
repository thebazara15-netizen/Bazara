import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-800 p-4">

      <h2 className="text-white text-xl mb-6">Dashboard</h2>

      <nav className="flex flex-col gap-4">
        <Link href="/admin" className="text-white">Admin</Link>
        <Link href="/vendor" className="text-white">Vendor</Link>
      </nav>

    </div>
  );
}