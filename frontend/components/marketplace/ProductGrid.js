import ProductCard from "./ProductCard";
import Icon from "./Icons";

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
        <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export function EmptyProductsState({ isSearch, onClear }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center sm:py-20">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="package" className="h-7 w-7" /></span>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{isSearch ? "No products match this search" : "No products available yet"}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{isSearch ? "Try a broader product name, category, or description." : "Products from the Bazara supplier network will appear here as they are listed."}</p>
      {isSearch && <button type="button" onClick={onClear} className="mt-5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">Clear search</button>}
    </div>
  );
}

export default function ProductGrid({ products, loading, error, searchQuery, viewerRole, cartProducts, onAddToCart, onClear }) {
  if (loading && products.length === 0) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">{Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center"><h3 className="font-bold text-rose-950">Products could not be loaded</h3><p className="mt-2 text-sm text-rose-700">Please refresh the page or try again shortly.</p></div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.length === 0 ? <EmptyProductsState isSearch={Boolean(searchQuery)} onClear={onClear} /> : products.map((product) => <ProductCard key={product.id} product={product} viewerRole={viewerRole} inCart={cartProducts.has(product.id)} onAddToCart={onAddToCart} />)}
    </div>
  );
}
