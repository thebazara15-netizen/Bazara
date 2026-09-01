import Link from "next/link";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

export default function TrendingSection({ products, loading, error, viewerRole, cartProducts, onAddToCart }) {
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <section id="trending-products" className="scroll-mt-48 border-y border-slate-200 bg-slate-100/70 py-14 sm:py-16">
      <div className="marketplace-container">
        <SectionHeader
          eyebrow="Trending on Bazara"
          title="Recently listed marketplace picks"
          description="A fresh selection based on the newest real product listings available from Bazara suppliers."
          href="/products"
          linkLabel="View all products"
        />
        {loading ? (
          <div className="mt-7 flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-96 min-w-[78vw] animate-pulse rounded-2xl bg-white sm:min-w-[44%] lg:min-w-0 lg:flex-1" />)}
          </div>
        ) : error ? (
          <p className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Recent products could not be loaded right now.</p>
        ) : recentProducts.length ? (
          <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
            {recentProducts.map((product) => (
              <div key={product.id} className="min-w-[82vw] snap-start sm:min-w-0">
                <ProductCard product={product} viewerRole={viewerRole} inCart={cartProducts.has(product.id)} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-bold text-slate-950">New listings will appear here</p>
            <p className="mt-2 text-sm text-slate-600">Browse the marketplace while suppliers add their latest products.</p>
            <Link href="/products" className="marketplace-button-secondary mt-5">Browse products</Link>
          </div>
        )}
      </div>
    </section>
  );
}
