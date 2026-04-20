import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="hidden md:block w-48 lg:w-64 min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 p-4 md:p-6 sticky top-0 border-r border-gray-700">

      <h2 className="text-white text-lg md:text-xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
        ⚙️ Admin
      </h2>

      <nav className="flex flex-col gap-2 md:gap-3">
        <Link 
          href="/admin" 
          className="text-gray-300 hover:text-orange-400 hover:bg-gray-700/30 transition p-2 md:p-3 rounded-lg text-sm md:text-base font-medium"
        >
          📊 Dashboard
        </Link>
        <Link 
          href="/admin" 
          className="text-gray-400 hover:text-orange-400 hover:bg-gray-700/30 transition p-2 md:p-3 rounded-lg text-sm md:text-base"
        >
          👥 Users
        </Link>
        <Link 
          href="/admin" 
          className="text-gray-400 hover:text-orange-400 hover:bg-gray-700/30 transition p-2 md:p-3 rounded-lg text-sm md:text-base"
        >
          💰 Pricing
        </Link>
        <Link 
          href="/admin" 
          className="text-gray-400 hover:text-orange-400 hover:bg-gray-700/30 transition p-2 md:p-3 rounded-lg text-sm md:text-base"
        >
          📋 Orders
        </Link>
      </nav>

    </div>
  );
}