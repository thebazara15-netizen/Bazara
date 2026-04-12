import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen text-white">

      {/* Navbar */}
      <div className="flex justify-between items-center px-10 py-4 bg-white text-black shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300"></div>
          <div>
            <h1 className="font-bold text-lg">ERAM INSTRUMENTS</h1>
            <p className="text-sm text-gray-600">
              Industrial IoT & Compliance
            </p>
          </div>
        </div>

        <Link href="/login">
          <button className="bg-orange-600 px-6 py-2 rounded-lg">
            Admin Login
          </button>
        </Link>
      </div>

      {/* Hero Section */}
      <div
        className="relative h-[85vh] flex flex-col justify-center items-center text-center bg-cover bg-center"
        style={{
          backgroundImage: "url('/industrial.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Industrial B2B Marketplace
          </h1>

          <p className="text-gray-300 mb-8 max-w-xl">
            Connect industries, manage bulk orders, and scale your business with our secure platform.
          </p>

          <div className="flex gap-6 justify-center">
          <Link href="/register">
            <button className="bg-orange-600 px-8 py-3 rounded-full">
              Register Industry
            </button>
          </Link>

          <Link href="/client">
            <button className="bg-green-600 px-8 py-3 rounded-full">
              Client Portal
            </button>
          </Link>

          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white text-black py-16 px-10">
        <div className="grid md:grid-cols-3 gap-10 text-center">

          <div>
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="font-semibold text-lg">Industrial</h2>
            <p className="text-gray-600">
              Built for industrial scale operations
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">📊</div>
            <h2 className="font-semibold text-lg">Analytics</h2>
            <p className="text-gray-600">
              Data-driven insights for growth
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">☁️</div>
            <h2 className="font-semibold text-lg">Cloud</h2>
            <p className="text-gray-600">
              24×7 availability with cloud support
            </p>
          </div>

        </div>
      </div>

      {/* Trusted Section */}
      <div className="py-16 text-center bg-gray-100 text-black">
        <h2 className="text-2xl font-bold">
          Trusted by Industries & Compliance Teams
        </h2>
      </div>

    </div>
  );
}