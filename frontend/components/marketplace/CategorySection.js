import Link from "next/link";
import Icon from "./Icons";
import SectionHeader from "./SectionHeader";

const fallbackCategories = [
  "Industrial Equipment",
  "Electronics",
  "Electrical",
  "Machinery",
  "Tools & Hardware",
  "Components",
  "Packaging",
  "Safety Products",
];

export default function CategorySection({ products }) {
  const productCategories = Array.from(new Set(products.map((product) => product.category?.trim()).filter(Boolean))).slice(0, 9);
  const categories = productCategories.length ? productCategories : fallbackCategories;
  const usingSuggestions = productCategories.length === 0;

  return (
    <section id="categories" className="scroll-mt-32 py-12 sm:py-16">
      <SectionHeader
        eyebrow="Category discovery"
        title="Find the right supply category"
        description={usingSuggestions ? "Explore common B2B sourcing areas while supplier categories are being added." : "Browse categories currently represented by products in the marketplace."}
      />
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, index) => (
          <Link
            key={category}
            href={`/products?category=${encodeURIComponent(category)}`}
            className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white p-3 text-center transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-red-500/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white"><Icon name={index % 3 === 0 ? "package" : index % 3 === 1 ? "storefront" : "categories"} /></span>
            <span className="mt-3 line-clamp-2 text-xs font-bold leading-4 text-slate-200">
              {category}
            </span>
          </Link>
        ))}
      </div>
      {usingSuggestions && <p className="mt-4 text-xs text-slate-500">Suggested browsing labels only — marketplace categories will appear here as products are listed.</p>}
    </section>
  );
}
