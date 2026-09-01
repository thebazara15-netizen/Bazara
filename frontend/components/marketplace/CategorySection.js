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
    <section id="categories" className="scroll-mt-44 py-14 sm:py-16">
      <SectionHeader
        eyebrow="Category discovery"
        title="Find the right supply category"
        description={usingSuggestions ? "Explore common B2B sourcing areas while supplier categories are being added." : "Browse categories currently represented by products in the marketplace."}
      />
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category}
            href={`/?search=${encodeURIComponent(category)}#featured-products`}
            className="group flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg hover:shadow-slate-200/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:min-h-32 sm:p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><Icon name={index % 3 === 0 ? "package" : index % 3 === 1 ? "storefront" : "categories"} /></span>
            <span className="mt-5 flex items-end justify-between gap-2 text-sm font-bold leading-5 text-slate-900 sm:text-base">
              {category}<Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-700" />
            </span>
          </Link>
        ))}
      </div>
      {usingSuggestions && <p className="mt-4 text-xs text-slate-500">Suggested browsing labels only — marketplace categories will appear here as products are listed.</p>}
    </section>
  );
}
