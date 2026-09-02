import ProductCard from "../ProductCard";
import SectionHeader from "../SectionHeader";

export default function RelatedProducts({ products, viewerRole, cartProducts, onAddToCart }) {
  if (!Array.isArray(products) || products.length === 0) return null;
  return (
    <section className="border-t border-slate-200 bg-white py-14 sm:py-16">
      <div className="marketplace-container"><SectionHeader eyebrow="More to explore" title="Related products" description="Other products listed in the same marketplace category." /><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} viewerRole={viewerRole} inCart={cartProducts.has(product.id)} onAddToCart={onAddToCart} />)}</div></div>
    </section>
  );
}
